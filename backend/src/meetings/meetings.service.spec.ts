import { Test, TestingModule } from '@nestjs/testing';
import { MeetingsService } from './meetings.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MeetingsService', () => {
  let service: MeetingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingsService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
            meeting: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MeetingsService>(MeetingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
