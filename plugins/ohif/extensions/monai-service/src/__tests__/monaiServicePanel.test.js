import React from 'react';
import { MonaiServicePanel } from './MonaiServicePanel';
import { render, waitFor } from '@testing-library/react';

jest.mock('../services/MonaiServiceClient', () => {
  return {
    MonaiServiceClient: jest.fn().mockImplementation(() => ({
      getAuthorizationHeader: () => ({ Authorization: 'Bearer fake_token' }),
      list_models: jest.fn().mockResolvedValue({
        status: 200,
        data: []
      }),
      cache_image: jest.fn().mockResolvedValue({})
    }))
  };
});

const mockNotificationService = {
  show: jest.fn(),
  hide: jest.fn()
};

const mockDisplaySetService = {
  activeDisplaySets: [{
    SeriesInstanceUID: '123',
    StudyInstanceUID: '456',
    instances: [{
      FrameOfReferenceUID: '789'
    }],
    displaySetInstanceUID: '101112'
  }]
};

// Test suite 
describe('MonaiServicePanel', () => {
  it('handles model and dataset information on successful connection', async () => {
    const props = {
      servicesManager: {
        services: {
          uiNotificationService: mockNotificationService,
          displaySetService: mockDisplaySetService
        }
      }
    };

    const { container } = render(<MonaiServicePanel {...props} />);

    const instance = container.querySelector('MonaiServicePanel');
    await instance.onInfo();

    expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
      type: 'info',
      message: 'Connecting to MONAI Service'
    }));
    await waitFor(() => {
      expect(mockNotificationService.show).toHaveBeenCalledWith(expect.objectContaining({
        type: 'success',
        message: 'Connected to MONAI Service Server - Successful'
      }));
    });
    expect(instance.state.info.models.length).toBeGreaterThan(0); 
  });
});
