import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import AutoSegmentation from './AutoSegmentation'; 
import ModelSelector from '../ModelSelector'; 

jest.mock('../ModelSelector', () => (props) => (
  <button onClick={props.onSelectModel}>Select Model</button>
));
jest.mock('../../utils/GenericUtils', () => ({
  hideNotification: jest.fn(),
}));

describe('AutoSegmentation', () => {
  let props;

  beforeEach(() => {
    props = {
      client: () => ({
        inference: jest.fn().mockResolvedValue({ status: 201 }),
      }),
      updateView: jest.fn(),
      notification: {
        show: jest.fn(),
        hide: jest.fn(),
      },
      servicesManager: {
        services: {
          displaySetService: {
            activeDisplaySets: [{ Modality: 'CT', SeriesInstanceUID: '123' }],
          }
        }
      },
      info: {
        models: [{ id: 'model1', network_arch: 'monai_vista3d' }],
        modelLabelNames: { 'model1': ['Label1', 'Label2'] },
        modelLabelIndices: { 'model1': [1, 2] },
        modelLabelToIdxMap: {
          'model1': { 'kidney': 1, 'lung': 2, 'bone': 3 }
        }
      },
      viewConstants: {
        SeriesInstanceUID: 'defaultSeriesInstanceUID'
      }
    };
  });

  it('renders correctly', () => {
    const { getByText } = render(<AutoSegmentation {...props} />);
    expect(getByText('Auto-Segmentation')).toBeInTheDocument();
  });

  it('calls onSelectModel when model is selected', () => {
    const { getByText } = render(<AutoSegmentation {...props} />);
    const selectButton = getByText('Select Model');
    fireEvent.click(selectButton);
    expect(props.info.models.length).toBeGreaterThan(0);
  });

  it('calls onSegmentation when model is run', async () => {
    const { getByText } = render(<AutoSegmentation {...props} />);
    const selectButton = getByText('Select Model');
    fireEvent.click(selectButton); 
    await waitFor(() => {
      expect(props.client().inference).toHaveBeenCalled();
    });
    expect(props.notification.show).toHaveBeenCalledWith(expect.objectContaining({
      title: 'MONAI Service',
      message: 'Run Segmentation - Successful',
      type: 'success',
    }));
  });
});

