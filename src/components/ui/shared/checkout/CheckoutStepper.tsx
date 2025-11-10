import React from 'react';
import { CreditCard, CheckCircle, Truck, MapPin } from 'lucide-react';

interface StepperProps {
  currentStep: 'address' | 'payment' | 'review' | 'success';
}

const steps = [
  { id: 'address', name: 'Spedizione', icon: MapPin },
  { id: 'payment', name: 'Pagamento', icon: CreditCard },
  { id: 'review', name: 'Riepilogo', icon: Truck },
  { id: 'success', name: 'Completato', icon: CheckCircle },
];

const CheckoutStepper: React.FC<StepperProps> = ({ currentStep }) => {
  return (
    <nav className="flex items-center justify-center space-x-4 mb-12" aria-label="Steps">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
        const Icon = step.icon;

        const statusClasses = isCompleted
          ? "bg-indigo-600 text-white border-indigo-600"  // Completato: Indaco Solido
          : isActive
          ? "bg-indigo-600 text-white border-indigo-600"  // Attivo: Indaco Solido
          : "bg-gray-100 text-gray-500 border-gray-300"; // Inattivo: Grigio Neutro
        return (
          <React.Fragment key={step.id}>
            {index !== 0 && (
           <div className={`h-0.5 w-16 transition-colors duration-300 ${isCompleted ? 'bg-indigo-600' : 'bg-gray-300'}`} />
            )}
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${statusClasses}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-xs mt-1 transition-colors duration-300 ${isActive || isCompleted ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`}>
                {step.name}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default CheckoutStepper;