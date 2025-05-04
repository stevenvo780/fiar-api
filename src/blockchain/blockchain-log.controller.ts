import { Controller, Get, Param } from '@nestjs/common';
import { BlockchainLogService } from './blockchain-log.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { BlockchainLog } from './entities/blockchain-log.entity';

@ApiTags('blockchain-logs')
@Controller('blockchain-logs')
export class BlockchainLogController {
  constructor(private readonly blockchainLogService: BlockchainLogService) {}

  @ApiOperation({ summary: 'Obtener todos los logs de blockchain' })
  @ApiOkResponse({ type: [BlockchainLog] })
  @Get()
  findAll() {
    return this.blockchainLogService.findAll();
  }

  @ApiOperation({ summary: 'Obtener logs por entidad e ID de entidad' })
  @ApiOkResponse({ type: [BlockchainLog] })
  @Get('entity/:entity/:entityId')
  findByEntity(
    @Param('entity') entity: string,
    @Param('entityId') entityId: string,
  ) {
    return this.blockchainLogService.findByEntity(entity, entityId);
  }
}
