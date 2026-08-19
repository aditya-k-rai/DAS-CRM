import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service';

@ApiTags('Attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Get('server-time')
  getServerTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: true });
    const dateStr = now.toISOString().split('T')[0];
    return {
      serverTime: `${dateStr} ${timeStr} (Server Authoritative Time)`,
      isoDate: now.toISOString(),
      timestampMs: now.getTime(),
      formattedTime: timeStr,
      formattedDate: dateStr,
    };
  }
}
