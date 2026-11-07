import { useNavigate } from 'react-router-dom';

export default function AuthStepper({ activeStep }) {
    const navigate = useNavigate();

    return (
        <div className="stepper-container">
            {/* Step 1: Register */}
            <div 
                className={`step-item ${activeStep === 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}`}
                onClick={() => navigate('/register')}
            >
                <div className="step-circle">1</div>
                <span className="step-label">Register</span>
            </div>

            {/* Garis Penghubung */}
            <div className={`step-line ${activeStep >= 2 ? 'active' : ''}`}></div>

            {/* Step 2: Login */}
            <div 
                className={`step-item ${activeStep === 2 ? 'active' : ''}`}
                onClick={() => navigate('/login')}
            >
                <div className="step-circle">2</div>
                <span className="step-label">Login</span>
            </div>
        </div>
    );
}