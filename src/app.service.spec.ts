import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return position data for an nft', async () => {
      const response = await appService.getPositionData({
        chainId: '10',
        tokenId: '172653',
        owner: '0x5231555186e4502bdB603c9E42Ae47f93C54d99D',
      });
      expect(response).toBeTruthy();
      console.log(response);
    });
  });
});
