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
    const delhiTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
    const delhiDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
    const fullDelhiStr = `${delhiDateStr} ${delhiTimeStr} IST (Delhi Server Time)`;
    return {
      serverTime: fullDelhiStr,
      delhiTime: delhiTimeStr,
      delhiDate: delhiDateStr,
      timeZone: 'Asia/Kolkata (Delhi Time)',
      isoDate: now.toISOString(),
      timestampMs: now.getTime(),
      formattedTime: delhiTimeStr,
      formattedDate: delhiDateStr,
    };
  }
}
