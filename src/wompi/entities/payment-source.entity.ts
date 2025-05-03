import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { SharedProp } from 'src/common/entities/sharedProp.helper';
import { PlanType } from '../../user/entities/subscription.entity';

export enum PaymentFrequency {
  MONTHLY = 'MONTHLY',
  ANNUALLY = 'ANNUALLY',
}

@Entity()
export class PaymentSource extends SharedProp {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sourceId: string;

  @Column({ default: true })
  active: boolean;

  @Column({
    type: 'enum',
    enum: PaymentFrequency,
    default: PaymentFrequency.MONTHLY,
  })
  frequency: PaymentFrequency;

  @Column({ type: 'timestamp', nullable: true })
  nextCharge: Date;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  planType: PlanType;

  @ManyToOne(() => User, (user) => user.paymentSources)
  user: User;
}
