import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SharedProp } from '@/common/entities/sharedProp.helper';

@Entity()
export class BlockchainLog extends SharedProp {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Identificador único del registro', example: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 50 })
  @ApiProperty({ description: 'Entidad asociada al registro', example: 'transaction' })
  entity: string;

  @Column({ type: 'uuid' })
  @ApiProperty({ description: 'ID de la entidad asociada', example: 'uuid' })
  entityId: string;

  @Column({ type: 'text' })
  @ApiProperty({ description: 'Hash de la transacción en blockchain', example: '0x123...' })
  txnHash: string;

  @Column({ type: 'text' })
  @ApiProperty({ description: 'Dirección del contrato asociado', example: '0xabc...' })
  contractAddress: string;

  @Column({ type: 'varchar', length: 30 })
  @ApiProperty({ description: 'Red de blockchain utilizada', example: 'Avalanche' })
  network: string;

  @Column({ type: 'bigint' })
  @ApiProperty({ description: 'Número de bloque en blockchain', example: 123456 })
  blockNumber: number;

  @Column({ type: 'text' })
  @ApiProperty({ description: 'Firma de la transacción', example: 'signature' })
  signature: string;

  @Column({ type: 'jsonb', nullable: true })
  @ApiProperty({ description: 'Prueba adicional en formato JSON', example: '{}' })
  proof?: Record<string, any>;
}
