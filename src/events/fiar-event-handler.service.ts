import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { TransactionService } from '../transaction/transaction.service';
import { CreateTransactionDto } from '../transaction/dto/create-transaction.dto';

export interface BusinessEvent {
  id: string;
  type: 'invoice.created' | 'invoice.updated' | 'payment.completed' | 'order.placed';
  source: string;
  timestamp: Date;
  data: Record<string, any>;
  metadata: {
    userId: string;
    traceId: string;
  };
}

export interface PluginResponse {
  success: boolean;
  data?: any;
  error?: string;
  nextEvents?: BusinessEvent[];
}

@Injectable()
export class FiarEventHandlerService implements OnModuleInit {
  private sinergiaWebhookUrl: string;
  private eventBusUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private transactionService: TransactionService,
  ) {
    this.sinergiaWebhookUrl = this.configService.get<string>('SINERGIA_WEBHOOK_URL') || 'http://localhost:4001/webhooks/plugins/fiar/response';
    this.eventBusUrl = this.configService.get<string>('EVENT_BUS_URL') || 'http://localhost:3100';
  }

  async onModuleInit() {
    // Register with plugin orchestration service on startup
    await this.registerPlugin();
    
    // Start listening to events
    await this.startEventConsumer();
  }

  async handleInvoiceCreated(event: BusinessEvent): Promise<void> {
    console.log('FIAR: Processing invoice.created event:', event.id);
    
    const { invoice } = event.data;
    if (!invoice) {
      await this.sendErrorResponse('Invoice data not found in event', event);
      return;
    }

    // Check if this invoice requires FIAR processing (e.g., payment type is 'Fiar')
    if (invoice.paymentType !== 'Fiar') {
      console.log('FIAR: Invoice does not require FIAR processing, skipping');
      return;
    }

    try {
      // Create FIAR credit transaction
      const clientData = {
        document: invoice.client?.documentNumber || '',
        name: invoice.client?.name || '',
        lastname: invoice.client?.surname || '',
        phone: invoice.client?.phone || '',
        city: invoice.client?.address || '',
        email: invoice.client?.email || '',
      };

      const transactionDto: CreateTransactionDto = {
        clientData,
        amount: invoice.totalAmount,
        status: invoice.paymentStatus === 'Paid' ? 'approved' : 'pending',
        operation: 'expense',
        detail: { 
          invoiceId: invoice.id,
          sinergyTrackingNumber: invoice.tracking_number,
          source: 'sinergia'
        },
      };

      // Create the credit transaction
      const transaction = await this.transactionService.createFromUserId(
        transactionDto,
        event.metadata.userId
      );

      console.log('FIAR: Credit transaction created successfully:', transaction.id);

      // Send success response back to Sinergia
      await this.sendSuccessResponse({
        creditTransaction: {
          id: transaction.id,
          status: transaction.status,
          amount: transaction.amount,
          createdAt: transaction.createdAt,
        },
        originalInvoice: invoice,
      }, event);

    } catch (error) {
      console.error('FIAR: Error creating credit transaction:', error);
      await this.sendErrorResponse(error.message || 'Failed to create FIAR transaction', event);
    }
  }

  async handlePaymentCompleted(event: BusinessEvent): Promise<void> {
    console.log('FIAR: Processing payment.completed event:', event.id);
    
    const { invoice } = event.data;
    if (!invoice) {
      return;
    }

    // Update existing FIAR transaction status if it exists
    try {
      await this.transactionService.updateByInvoiceId(invoice.id, {
        status: 'approved',
        detail: {
          ...invoice.detail,
          paymentCompletedAt: new Date(),
        },
      });

      console.log('FIAR: Transaction status updated to approved for invoice:', invoice.id);
    } catch (error) {
      console.error('FIAR: Error updating transaction status:', error);
    }
  }

  private async sendSuccessResponse(data: any, originalEvent: BusinessEvent): Promise<void> {
    const response: PluginResponse = {
      success: true,
      data,
      nextEvents: [], // Could generate additional events if needed
    };

    try {
      await firstValueFrom(
        this.httpService.post(this.sinergiaWebhookUrl, response, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': this.configService.get<string>('SINERGIA_API_KEY'),
            'X-Trace-ID': originalEvent.metadata.traceId,
          },
        })
      );
      console.log('FIAR: Success response sent to Sinergia');
    } catch (error) {
      console.error('FIAR: Failed to send success response to Sinergia:', error);
    }
  }

  private async sendErrorResponse(errorMessage: string, originalEvent: BusinessEvent): Promise<void> {
    const response: PluginResponse = {
      success: false,
      error: errorMessage,
    };

    try {
      await firstValueFrom(
        this.httpService.post(this.sinergiaWebhookUrl, response, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': this.configService.get<string>('SINERGIA_API_KEY'),
            'X-Trace-ID': originalEvent.metadata.traceId,
          },
        })
      );
      console.log('FIAR: Error response sent to Sinergia');
    } catch (error) {
      console.error('FIAR: Failed to send error response to Sinergia:', error);
    }
  }

  private async registerPlugin(): Promise<void> {
    try {
      const pluginDefinition = {
        id: 'fiar',
        name: 'FIAR Credit Management',
        version: '1.0.0',
        endpoints: {
          webhook: this.sinergiaWebhookUrl,
          health: `${this.configService.get<string>('FIAR_BASE_URL')}/health`,
        },
        triggers: ['invoice.created', 'payment.completed'],
        config: {
          enabled: true,
          apiKey: this.configService.get<string>('SINERGIA_API_KEY'),
        },
      };

      const orchestrationUrl = this.configService.get<string>('PLUGIN_ORCHESTRATION_URL') || 'http://localhost:3200';
      
      await firstValueFrom(
        this.httpService.post(`${orchestrationUrl}/plugins/register`, pluginDefinition, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': this.configService.get<string>('PLUGIN_ORCHESTRATION_API_KEY'),
          },
        })
      );
      
      console.log('FIAR: Plugin registered successfully with orchestration service');
    } catch (error) {
      console.error('FIAR: Failed to register plugin:', error);
    }
  }

  private async startEventConsumer(): Promise<void> {
    // This is a simplified event consumer
    // In a real implementation, you would use a proper message queue or event streaming service
    try {
      const subscribeUrl = `${this.eventBusUrl}/subscribe`;
      await firstValueFrom(
        this.httpService.post(subscribeUrl, {
          pluginId: 'fiar',
          eventTypes: ['invoice.created', 'payment.completed'],
          webhookUrl: `${this.configService.get<string>('FIAR_BASE_URL')}/api/v1/events/webhook`,
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': this.configService.get<string>('EVENT_BUS_API_KEY'),
          },
        })
      );
      
      console.log('FIAR: Successfully subscribed to events');
    } catch (error) {
      console.error('FIAR: Failed to subscribe to events:', error);
    }
  }

  async sendHealthUpdate(status: 'healthy' | 'unhealthy' | 'degraded'): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.sinergiaWebhookUrl.replace('/response', '/health')}`, {
          status,
          timestamp: new Date().toISOString(),
          metadata: {
            version: '1.0.0',
            uptime: process.uptime(),
          },
        }, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': this.configService.get<string>('SINERGIA_API_KEY'),
          },
        })
      );
    } catch (error) {
      console.error('FIAR: Failed to send health update:', error);
    }
  }
}