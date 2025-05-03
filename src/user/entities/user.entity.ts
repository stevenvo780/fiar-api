import { Entity, PrimaryColumn, Column, OneToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SharedProp } from '../../common/entities/sharedProp.helper';
import { Profile } from '../../profile/entities/profile.entity';
import { Subscription } from './subscription.entity';
import { PaymentSource } from '../../wompi/entities/payment-source.entity';
import { Client } from '../../client/entities/client.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  BUSINESS_OWNER = 'business_owner',
  CUSTOMER = 'customer',
}

@Entity()
export class User extends SharedProp {
  @PrimaryColumn()
  @ApiProperty({
    description: 'Unique identifier of the user',
    example: 'abc123',
  })
  id: string;

  @Column({ unique: true })
  @ApiProperty({
    description: 'Unique email address of the user',
    example: 'user@example.com',
  })
  email: string;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    nullable: true,
  })
  name?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role_enum',
    default: UserRole.CUSTOMER,
  })
  @ApiProperty({
    description: 'Role of the user in the system',
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  role: UserRole;

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: true,
    nullable: true,
  })
  profile?: Profile;

  @OneToOne(() => Subscription, (subscription) => subscription.user, {
    cascade: true,
    nullable: true,
  })
  subscription?: Subscription;

  @OneToMany(() => Client, (client) => client.user, { cascade: true })
  clients: Client[];

  @OneToMany(() => PaymentSource, (paymentSource) => paymentSource.user)
  paymentSources: PaymentSource[];
}
