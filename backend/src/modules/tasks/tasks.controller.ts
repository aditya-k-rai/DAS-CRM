import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks with status, due date, and pagination filters' })
  findAll(@CurrentUser() user: any, @Query() query: any) {
    return this.tasksService.findAll(user.organizationId, user.id, query || {}, user.role);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task, follow-up or meeting' })
  create(@CurrentUser() user: any, @Body() dto: any) {
    return this.tasksService.create(user.organizationId, user.id, dto);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Mark a task as completed' })
  complete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.complete(user.organizationId, id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tasksService.delete(user.organizationId, id);
  }
}

