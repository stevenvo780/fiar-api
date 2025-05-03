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
  RequestTimeoutException,
} from '@nestjs/common';
import { WompiService } from './wompi.service';
import { FirebaseAuthGuard } from '@/auth/firebase-auth.guard';
import { RequestWithUser } from '@/auth/types';
import { CreditCardPaymentDto } from './dto/credit-card-payment.dto';
import { Request, Response } from 'express';

@Controller('wompi')
export class WompiController {
  constructor(private readonly wompiService: WompiService) {}

  @Post('subscribe')
  @UseGuards(FirebaseAuthGuard)
  async subscribe(
    @Req() req: RequestWithUser,
    @Body() paymentData: CreditCardPaymentDto,
  ) {
    try {
      const result = await this.wompiService.processSubscription({
        userId: req.user.id,
        email: req.user.email,
        ...paymentData,
      });

      return {
        success: true,
        subscription: result,
        message: 'Suscripción confirmada correctamente',
      };
    } catch (error) {
      console.error(
        'Error procesando la suscripción:',
        JSON.stringify(error.response?.data || error.message, null, 2),
      );

      if (
        error instanceof BadRequestException ||
        error instanceof RequestTimeoutException
      ) {
        throw error;
      }

      throw new BadRequestException({
        message: 'Error procesando la suscripción',
        details: error.message || 'Error desconocido',
      });
    }
  }

  @Post('cancel-subscription')
  @UseGuards(FirebaseAuthGuard)
  cancelSubscription(@Req() req: RequestWithUser) {
    return this.wompiService.cancelSubscription(req.user.id);
  }

  @Post('renew-subscriptions')
  async renewSubscriptions(@Query('accessKey') accessKey: string) {
    if (accessKey !== process.env.RENEWAL_ACCESS_KEY) {
      throw new BadRequestException('Clave de acceso inválida');
    }
    try {
      return await this.wompiService.renewSubscriptions();
    } catch (error) {
      console.error('Error en renovación de suscripciones:', error);
      throw new BadRequestException({
        message: 'Error en renovación de suscripciones',
        details: error.message,
      });
    }
  }

  @Post('webhook')
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    try {
      const payload = req.body;
      const summary = await this.wompiService.handleWebhookEvent(payload);

      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        summary,
      });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Error procesando webhook',
        details: error.message,
      });
    }
  }
}
