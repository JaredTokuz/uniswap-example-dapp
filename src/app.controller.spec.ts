import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return position data for an nft', async () => {
      const chainId = '10';
      const response = await appController.getPosition({
        chainId,
        tokenId: '172653',
        owner: '0x5231555186e4502bdB603c9E42Ae47f93C54d99D',
      });
      console.log(response);

      expect(response).toBeTruthy();
    });
  });
});
