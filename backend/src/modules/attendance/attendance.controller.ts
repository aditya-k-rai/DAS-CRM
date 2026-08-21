import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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

  @Post('punch')
  async recordPunch(@Body() body: { type: 'IN' | 'OUT'; location?: string; image?: string }) {
    const now = new Date();
    const delhiTimeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
    const delhiDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return {
      success: true,
      message: `Attendance Punch ${body.type || 'IN'} Recorded Successfully`,
      type: body.type || 'IN',
      location: body.location || 'Acme HQ Office Hub (28.440743, 77.531117)',
      image: body.image || null,
      serverTime: `${delhiDateStr} ${delhiTimeStr} IST`,
      timestamp: now.toISOString(),
    };
  }
}
