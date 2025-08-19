import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Step1BasicInfo } from './steps/Step1BasicInfo';
import { Step2SelectType } from './steps/Step2SelectType';
import { Step3SelectTemplate } from './steps/Step3SelectTemplate';
import { Step4Configuration } from './steps/Step4Configuration';
import { Step5Credentials } from './steps/Step5Credentials';
import { Step6Testing } from './steps/Step6Testing';

export interface WizardData {
  // Step 1: Basic Info
  name: string;
  description: string;
  
  // Step 2: Type Selection
  type?: 'http' | 'email' | 'webhook' | 'timer' | 'data-transform';
  
  // Step 3: Template Selection
  templateId?: string;
  template?: any;
  
  // Step 4: Configuration
  configuration: Record<string, any>;
  
  // Step 5: Credentials
  credentials: Record<string, any>;
  
  // Step 6: Testing
  testResult?: {
    success: boolean;
    message: string;
    details: any;
  };
}

interface ConnectorWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (connectorId: string) => void;
}

const STEPS = [
  { id: 1, title: 'Información Básica', component: Step1BasicInfo },
  { id: 2, title: 'Tipo de Conector', component: Step2SelectType },
  { id: 3, title: 'Plantilla', component: Step3SelectTemplate },
  { id: 4, title: 'Configuración', component: Step4Configuration },
  { id: 5, title: 'Credenciales', component: Step5Credentials },
  { id: 6, title: 'Pruebas', component: Step6Testing },
];

export const ConnectorWizard: React.FC<ConnectorWizardProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    name: '',
    description: '',
    configuration: {},
    credentials: {},
  });

  if (!isOpen) return null;

  const handleUpdate = (updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    try {
      // TODO: Implement connector creation with all wizard data
      console.log('Creating connector with data:', wizardData);
      
      // Simulate API call
      const connectorId = 'temp-connector-id';
      onSuccess(connectorId);
      onClose();
      
      // Reset wizard state
      setCurrentStep(1);
      setWizardData({
        name: '',
        description: '',
        configuration: {},
        credentials: {},
      });
    } catch (error) {
      console.error('Error creating connector:', error);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset wizard state
    setCurrentStep(1);
    setWizardData({
      name: '',
      description: '',
      configuration: {},
      credentials: {},
    });
  };

  const currentStepConfig = STEPS.find(step => step.id === currentStep);
  const CurrentStepComponent = currentStepConfig?.component;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-medium text-gray-900">Crear Nuevo Conector</h2>
            <div className="flex items-center space-x-2">
              {STEPS.map((step, index) => (
                <React.Fragment key={step.id}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.id === currentStep
                        ? 'bg-blue-600 text-white'
                        : step.id < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-8 h-1 rounded ${
                        step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Title */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Paso {currentStep}: {currentStepConfig?.title}
          </h3>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {CurrentStepComponent && (
            <CurrentStepComponent
              data={wizardData}
              onUpdate={handleUpdate}
              onFinish={handleFinish}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            
            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Crear Conector
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 