import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';
import { SharedProp } from '../../common/entities/sharedProp.helper';

@Entity('profile')
export class Profile extends SharedProp {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'Unique identifier for the profile',
    example: 1,
  })
  id: number;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  @ApiProperty({
    description: 'Phone number for the profile',
    example: '+1234567890',
    nullable: true,
  })
  phone?: string;

  @Column({ name: 'commerce_name', type: 'text', nullable: true })
  @ApiProperty({
    description: 'Name of the associated business or commerce',
    example: 'Distribuciones El Trece',
    nullable: true,
  })
  commerce_name?: string;
}
