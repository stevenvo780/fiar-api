import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { PaymentSource } from '../../wompi/entities/payment-source.entity';

export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export const PLAN_DETAILS: Record<
  PlanType,
  { price: number; monthlyOrderLimit: number; name: string; sku: string }
> = {
  [PlanType.FREE]: {
    price: 0,
    monthlyOrderLimit: 2000000,
    name: PlanType.FREE,
    sku: PlanType.FREE,
  },
  [PlanType.BASIC]: {
    price: 30000,
    monthlyOrderLimit: 500,
    name: PlanType.BASIC,
    sku: PlanType.BASIC,
  },
  [PlanType.PRO]: {
    price: 80000,
    monthlyOrderLimit: 3000,
    name: PlanType.PRO,
    sku: PlanType.PRO,
  },
  [PlanType.ENTERPRISE]: {
    price: 200000,
    monthlyOrderLimit: 50000,
    name: PlanType.ENTERPRISE,
    sku: PlanType.ENTERPRISE,
  },
};

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, { nullable: false })
  @JoinColumn()
  user: User;

  @Column({
    type: 'enum',
    enum: PlanType,
  })
  planType: PlanType;

  @CreateDateColumn()
  startDate: Date;

  @Column({ nullable: true })
  endDate: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => PaymentSource, { nullable: true })
  @JoinColumn()
  lastPaymentSource: PaymentSource;

  /** ID de la suscripción recurrente en Mercado Pago (preapproval_id) */
  @Column({ nullable: true })
  mpSubscriptionId: string;

  /** Estado de la suscripción en MP: authorized, pending, paused, cancelled */
  @Column({ nullable: true })
  mpSubscriptionStatus: string;
}
