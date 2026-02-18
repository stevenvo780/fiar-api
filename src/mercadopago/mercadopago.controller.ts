import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  Res,
  HttpStatus,
  Get,
  Logger,
  Param,
} from '@nestjs/common';
import { MercadoPagoService } from './mercadopago.service';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { RequestWithUser } from '@/auth/types';
import { MercadoPagoPaymentDto } from './dto/mercadopago-payment.dto';
import { Request, Response } from 'express';

@Controller('mercadopago')
export class MercadoPagoController {
  private readonly logger = new Logger(MercadoPagoController.name);

  constructor(private readonly mercadoPagoService: MercadoPagoService) {}

  /**
   * POST /mercadopago/subscribe
   * Crea una suscripción recurrente en Mercado Pago y retorna la URL de checkout.
   * MP se encarga de cobrar automáticamente según la periodicidad elegida.
   */
  @Post('subscribe')
  @UseGuards(FirebaseAuthGuard)
  async subscribe(
    @Req() req: RequestWithUser,
    @Body() paymentData: MercadoPagoPaymentDto,
  ) {
    try {
      const result = await this.mercadoPagoService.createSubscription({
        userId: req.user.id,
        email: req.user.email,
        planType: paymentData.planType,
        frequency: paymentData.frequency,
      });

      return {
        success: true,
        ...result,
        message:
          'Suscripción recurrente creada. Redirige al usuario a init_point.',
      };
    } catch (error) {
      this.logger.error(
        'Error creando suscripción:',
        JSON.stringify(error.response || error.message, null, 2),
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException({
        message: 'Error creando la suscripción recurrente',
        details: error.message || 'Error desconocido',
      });
    }
  }

  /**
   * GET /mercadopago/subscription-info
   * Consulta el estado de la suscripción recurrente del usuario autenticado.
   */
  @Get('subscription-info')
  @UseGuards(FirebaseAuthGuard)
  async getSubscriptionInfo(@Req() req: RequestWithUser) {
    return this.mercadoPagoService.getSubscriptionInfo(req.user.id);
  }

  /**
   * GET /mercadopago/payment-status/:paymentId
   * Consulta el estado de un pago individual.
   */
  @Get('payment-status/:paymentId')
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.mercadoPagoService.getPaymentStatus(paymentId);
  }

  /**
   * POST /mercadopago/cancel-subscription
   * Cancela la suscripción recurrente en MP y baja al plan FREE.
   */
  @Post('cancel-subscription')
  @UseGuards(FirebaseAuthGuard)
  cancelSubscription(@Req() req: RequestWithUser) {
    return this.mercadoPagoService.cancelSubscription(req.user.id);
  }

  /**
   * GET /mercadopago/cancel-subscription
   * Alias GET para compatibilidad con el frontend existente.
   */
  @Get('cancel-subscription')
  @UseGuards(FirebaseAuthGuard)
  cancelSubscriptionGet(@Req() req: RequestWithUser) {
    return this.mercadoPagoService.cancelSubscription(req.user.id);
  }

  /**
   * POST /mercadopago/pause-subscription
   * Pausa la suscripción recurrente (se puede reactivar después).
   */
  @Post('pause-subscription')
  @UseGuards(FirebaseAuthGuard)
  pauseSubscription(@Req() req: RequestWithUser) {
    return this.mercadoPagoService.pauseSubscription(req.user.id);
  }

  /**
   * POST /mercadopago/webhook
   * Recibe notificaciones de Mercado Pago (pagos y suscripciones).
   */
  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      const payload = req.body;
      this.logger.log('Webhook MP recibido:', JSON.stringify(payload));

      const result = await this.mercadoPagoService.handleWebhookEvent(payload);

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      this.logger.error('Error processing webhook:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error procesando webhook',
        details: error.message,
      });
    }
  }
}
