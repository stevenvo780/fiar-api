import { Controller, Post, Body, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { FiarEventHandlerService, BusinessEvent } from './fiar-event-handler.service';

@ApiTags('Event Webhooks')
@Controller('events')
export class EventWebhookController {
  constructor(private fiarEventHandler: FiarEventHandlerService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Receive events from Event Bus' })
  @ApiBody({ 
    description: 'Business event data',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        type: { type: 'string' },
        source: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        data: { type: 'object' },
        metadata: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            traceId: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Event processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  async handleEvent(
    @Body() event: BusinessEvent,
    @Headers('x-api-key') apiKey?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate API key
      const expectedApiKey = process.env.EVENT_BUS_API_KEY;
      if (!apiKey || apiKey !== expectedApiKey) {
        throw new HttpException('Invalid API key', HttpStatus.UNAUTHORIZED);
      }

      console.log(`FIAR: Received event ${event.type} with ID: ${event.id}`);

      // Route event to appropriate handler
      switch (event.type) {
        case 'invoice.created':
          await this.fiarEventHandler.handleInvoiceCreated(event);
          break;

        case 'payment.completed':
          await this.fiarEventHandler.handlePaymentCompleted(event);
          break;

        default:
          console.log(`FIAR: Ignoring event type: ${event.type}`);
          break;
      }

      return {
        success: true,
        message: `Event ${event.id} processed successfully`,
      };
    } catch (error) {
      console.error('FIAR: Error processing event:', error);
      throw new HttpException(
        error.message || 'Failed to process event',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('health-check')
  @ApiOperation({ summary: 'Plugin health check endpoint' })
  async healthCheck(): Promise<{ status: string; timestamp: string; uptime: number }> {
    try {
      // Update health status
      await this.fiarEventHandler.sendHealthUpdate('healthy');
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    } catch (error) {
      await this.fiarEventHandler.sendHealthUpdate('unhealthy');
      throw new HttpException('Health check failed', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}