import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  BadRequestException,
  Query,
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
   * Crea una preferencia de Checkout Pro y retorna la URL de pago.
   */
  @Post('subscribe')
  @UseGuards(FirebaseAuthGuard)
  async subscribe(
    @Req() req: RequestWithUser,
    @Body() paymentData: MercadoPagoPaymentDto,
  ) {
    try {
      const preference = await this.mercadoPagoService.createPreference({
        userId: req.user.id,
        email: req.user.email,
        planType: paymentData.planType,
        frequency: paymentData.frequency,
      });

      return {
        success: true,
        ...preference,
        message: 'Preferencia creada. Redirige al usuario a init_point.',
      };
    } catch (error) {
      this.logger.error(
        'Error creando preferencia:',
        JSON.stringify(error.response || error.message, null, 2),
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException({
        message: 'Error creando la preferencia de pago',
        details: error.message || 'Error desconocido',
      });
    }
  }

  /**
   * GET /mercadopago/payment-status/:paymentId
   * Consulta el estado de un pago (para la página de retorno).
   */
  @Get('payment-status/:paymentId')
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.mercadoPagoService.getPaymentStatus(paymentId);
  }

  /**
   * POST /mercadopago/cancel-subscription
   * Cancela la suscripción activa del usuario autenticado.
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
   * POST /mercadopago/renew-subscriptions
   * Renueva las suscripciones vencidas. Protegido por accessKey.
   */
  @Post('renew-subscriptions')
  async renewSubscriptions(@Query('accessKey') accessKey: string) {
    if (accessKey !== process.env.RENEWAL_ACCESS_KEY) {
      throw new BadRequestException('Clave de acceso inválida');
    }
    try {
      return await this.mercadoPagoService.renewSubscriptions();
    } catch (error) {
      this.logger.error('Error en renovación de suscripciones:', error);
      throw new BadRequestException({
        message: 'Error en renovación de suscripciones',
        details: error.message,
      });
    }
  }

  /**
   * POST /mercadopago/webhook
   * Recibe notificaciones de Mercado Pago (IPN/Webhooks).
   */
  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      const payload = req.body;
      this.logger.log('Webhook MP recibido:', JSON.stringify(payload));

      const result =
        await this.mercadoPagoService.handleWebhookEvent(payload);

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
