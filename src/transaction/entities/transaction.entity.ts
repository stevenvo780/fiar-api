import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { ApiProperty } from '@nestjs/swagger';
  import { SharedProp } from '@/common/entities/sharedProp.helper';
  import { User } from '../../user/entities/user.entity';
  import { Client } from '../../client/entities/client.entity';
  
  @Entity()
  export class Transaction extends SharedProp {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ description: 'Identificador único de la transacción', example: 'uuid' })
    id: string;
  
    @ManyToOne(() => User, { nullable: false })
    @JoinColumn({ name: 'owner_id' })
    @ApiProperty({ description: 'Usuario que creó esta transacción', type: () => User })
    owner: User;
  
    @ManyToOne(() => Client, { nullable: false })
    @JoinColumn({ name: 'client_id' })
    @ApiProperty({ description: 'Cliente asociado a esta transacción', type: () => Client })
    client: Client;
  
    @Column({ type: 'numeric', precision: 12, scale: 2 })
    @ApiProperty({ description: 'Monto de la transacción', example: 100000.00 })
    amount: number;
  
    @Column({ type: 'text' })
    @ApiProperty({ description: 'Estado de la transacción', example: 'pending' })
    status: string;
  
    @Column({ type: 'json', nullable: true })
    @ApiProperty({ description: 'Detalles adicionales de la transacción', example: '{}' })
    detail?: Record<string, any>;
  
    @Column({ type: 'text', nullable: true })
    @ApiProperty({ description: 'Hash de transacción en blockchain', example: 'uuid' })
    txn_hash?: string;
  }
  