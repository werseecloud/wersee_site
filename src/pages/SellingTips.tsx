import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PageWrapper } from '../components/PageWrapper';
import { BookOpen, CheckCircle, ChevronRight, Star, Trophy, ArrowRight, PlayCircle, Lock } from 'lucide-react';
import { cn } from '../lib/utils';
import { SEO } from '../components/SEO';

const MODULES = [
  {
    id: 1,
    title: "Mastering Preparation",
    description: "Learn how to present your products like a pro.",
    steps: [
      { id: 1, title: "High-Quality Photography", content: "Lighting is key. Use natural light and a clean background." },
      { id: 2, title: "Compelling Descriptions", content: "Tell a story. Focus on benefits, not just features." },
      { id: 3, title: "Strategic Pricing", content: "Research competitors and price for value." },
      { id: 4, title: "SEO Basics", content: "Use keywords in your title and description to get found." },
      { id: 5, title: "Inventory Management", content: "Keep track of your stock to avoid overselling." },
    ]
  },
  {
    id: 2,
    title: "Marketing Mastery",
    description: "Get your products in front of the right audience.",
    steps: [
      { id: 1, title: "Social Media Strategy", content: "Choose the right platforms for your audience." },
      { id: 2, title: "Influencer Collaboration", content: "Partner with creators to reach new customers." },
      { id: 3, title: "Email Marketing", content: "Build a list and nurture your customers." },
      { id: 4, title: "Paid Advertising", content: "Start small with Facebook or Instagram ads." },
      { id: 5, title: "Content Marketing", content: "Create valuable content that attracts buyers." },
    ]
  },
  {
    id: 3,
    title: "Customer Excellence",
    description: "Turn buyers into loyal fans.",
    steps: [
      { id: 1, title: "Fast Communication", content: "Reply to messages within 24 hours." },
      { id: 2, title: "Packaging Experience", content: "Make unboxing a delight." },
      { id: 3, title: "Handling Returns", content: "Be fair and transparent with your policy." },
      { id: 4, title: "Getting Reviews", content: "Ask for feedback at the right time." },
      { id: 5, title: "Building Loyalty", content: "Reward repeat customers." },
    ]
  },
  {
    id: 4,
    title: "Scaling Up",
    description: "Take your business to the next level.",
    steps: [
      { id: 1, title: "Analyzing Data", content: "Use analytics to make data-driven decisions." },
      { id: 2, title: "Expanding Product Line", content: "Add complementary products." },
      { id: 3, title: "Outsourcing", content: "Hire help for tasks you don't enjoy." },
      { id: 4, title: "Global Expansion", content: "Start shipping internationally." },
      { id: 5, title: "Building a Brand", content: "Create a consistent visual identity." },
    ]
  }
];

export const SellingTips = () => {
  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const handleModuleClick = (moduleId: number) => {
    setActiveModule(moduleId);
    setActiveStep(0);
  };

  const handleStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    if (activeModule !== null) {
      const currentModule = MODULES.find(m => m.id === activeModule);
      if (currentModule && activeStep < currentModule.steps.length - 1) {
        setActiveStep(activeStep + 1);
      } else {
        // Module complete
        setActiveModule(null);
      }
    }
  };

  const currentModuleData = MODULES.find(m => m.id === activeModule);
  const currentStepData = currentModuleData?.steps[activeStep];

  return (
    <PageWrapper>
      <SEO 
        title="Seller Academy - Master the Art of Selling"
        description="Interactive courses to help you master product preparation, marketing, customer service, and scaling your business."
        url="/selling-tips"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[#1D1D1F] mb-4">Seller Academy</h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Master the art of selling with our interactive courses. Level up your business today.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!activeModule ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              {MODULES.map((module) => {
                const moduleSteps = module.steps.map(s => `${module.id}-${s.id}`);
                const completedCount = moduleSteps.filter(s => completedSteps.includes(s)).length;
                const progress = (completedCount / module.steps.length) * 100;
                const isLocked = module.id > 1 && !MODULES[module.id - 2].steps.every(s => completedSteps.includes(`${module.id - 1}-${s.id}`));

                return (
                  <button
                    key={module.id}
                    onClick={() => !isLocked && handleModuleClick(module.id)}
                    disabled={isLocked}
                    className={cn(
                      "group relative p-8 rounded-3xl border-2 text-left transition-all overflow-hidden",
                      isLocked 
                        ? "bg-gray-50 border-gray-100 cursor-not-allowed opacity-70" 
                        : "bg-white border-black/5 hover:border-black/20 hover:shadow-xl"
                    )}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl",
                        isLocked ? "bg-gray-300" : "bg-black"
                      )}>
                        {module.id}
                      </div>
                      {isLocked ? (
                        <Lock className="w-6 h-6 text-gray-300" />
                      ) : progress === 100 ? (
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Completed
                        </div>
                      ) : (
                        <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                          {completedCount}/{module.steps.length} Steps
                        </div>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-[#1D1D1F] mb-2 group-hover:text-blue-600 transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-gray-500 mb-8">{module.description}</p>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl shadow-xl border border-black/5 overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[600px]">
                {/* Sidebar */}
                <div className="bg-gray-50 p-6 border-r border-gray-100">
                  <button 
                    onClick={() => setActiveModule(null)}
                    className="flex items-center gap-2 text-gray-500 hover:text-black mb-8 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" /> Back to Modules
                  </button>
                  
                  <h3 className="font-bold text-lg mb-6">{currentModuleData?.title}</h3>
                  
                  <div className="space-y-2">
                    {currentModuleData?.steps.map((step, index) => {
                      const stepId = `${activeModule}-${step.id}`;
                      const isCompleted = completedSteps.includes(stepId);
                      const isActive = index === activeStep;

                      return (
                        <button
                          key={step.id}
                          onClick={() => setActiveStep(index)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                            isActive ? "bg-white shadow-sm ring-1 ring-black/5" : "hover:bg-gray-100",
                            isCompleted ? "text-green-700" : "text-gray-600"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs border",
                            isCompleted ? "bg-green-100 border-green-200 text-green-700" : 
                            isActive ? "bg-black text-white border-black" : "bg-white border-gray-200"
                          )}>
                            {isCompleted ? <CheckCircle className="w-3 h-3" /> : index + 1}
                          </div>
                          <span className={cn("text-sm font-medium", isActive && "text-black")}>
                            {step.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-2 p-8 lg:p-12 flex flex-col">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
                      Step {activeStep + 1} of {currentModuleData?.steps.length}
                    </div>
                    
                    <h2 className="text-3xl font-bold text-[#1D1D1F] mb-6">
                      {currentStepData?.title}
                    </h2>
                    
                    <div className="prose prose-lg text-gray-600 max-w-none">
                      <p>{currentStepData?.content}</p>
                      <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                      </p>
                      <div className="bg-yellow-50 p-6 rounded-2xl my-8 border border-yellow-100">
                        <h4 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                          <Star className="w-5 h-5" /> Pro Tip
                        </h4>
                        <p className="text-yellow-800 text-sm">
                          Consistency is key. Make sure to apply this step to all your listings for maximum impact.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-100 flex justify-between items-center">
                    <button
                      onClick={() => activeStep > 0 && setActiveStep(activeStep - 1)}
                      disabled={activeStep === 0}
                      className="px-6 py-3 text-gray-500 font-medium disabled:opacity-50 hover:text-black transition-colors"
                    >
                      Previous
                    </button>
                    
                    <button
                      onClick={() => handleStepComplete(`${activeModule}-${currentStepData?.id}`)}
                      className="px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-all flex items-center gap-2"
                    >
                      {activeStep === (currentModuleData?.steps.length || 0) - 1 ? (
                        <>Finish Module <Trophy className="w-4 h-4" /></>
                      ) : (
                        <>Next Step <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
};
