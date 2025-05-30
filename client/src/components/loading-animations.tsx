import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Heart, ThumbsUp, Smile, CheckCircle, Send } from "lucide-react";

interface LoadingAnimationProps {
  isLoading: boolean;
  onComplete?: () => void;
}

// Floating stars animation for review submission
export function ReviewSubmissionAnimation({ isLoading, onComplete }: LoadingAnimationProps) {
  const [stage, setStage] = useState(0);
  const [stars, setStars] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    if (!isLoading) {
      setStage(0);
      setStars([]);
      return;
    }

    const timer1 = setTimeout(() => setStage(1), 500);
    const timer2 = setTimeout(() => setStage(2), 1500);
    const timer3 = setTimeout(() => {
      setStage(3);
      onComplete?.();
    }, 2500);

    // Generate floating stars
    const newStars = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 300,
      y: Math.random() * 200,
    }));
    setStars(newStars);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isLoading, onComplete]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full mx-4 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {stage === 0 && (
            <motion.div
              key="sending"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Send className="h-12 w-12 text-primary mx-auto" />
              </motion.div>
              <h3 className="text-xl font-semibold text-foreground">Sending your review...</h3>
              <div className="flex justify-center space-x-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full"
                    animate={{ y: [0, -10, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {stage === 1 && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="space-y-4"
            >
              <div className="relative">
                {stars.map((star) => (
                  <motion.div
                    key={star.id}
                    className="absolute"
                    initial={{ 
                      opacity: 0, 
                      x: star.x - 150, 
                      y: star.y - 100,
                      scale: 0 
                    }}
                    animate={{ 
                      opacity: [0, 1, 1, 0], 
                      scale: [0, 1, 1, 0],
                      rotate: 360 
                    }}
                    transition={{
                      duration: 2,
                      delay: star.id * 0.1,
                      repeat: Infinity,
                      repeatDelay: 1,
                    }}
                  >
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  </motion.div>
                ))}
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Heart className="h-16 w-16 text-red-500 mx-auto fill-current" />
                </motion.div>
              </div>
              <h3 className="text-xl font-semibold text-foreground">Processing your feedback...</h3>
              <p className="text-muted-foreground">We love hearing from you!</p>
            </motion.div>
          )}

          {stage === 2 && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              </motion.div>
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xl font-semibold text-foreground"
              >
                Thank you for your review!
              </motion.h3>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground"
              >
                Your feedback helps us improve
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confetti effect for success */}
        {stage === 2 && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                initial={{
                  x: "50%",
                  y: "50%",
                  scale: 0,
                }}
                animate={{
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 400 - 200,
                  scale: [0, 1, 0],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.05,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Quick thumbs up animation for simple interactions
export function ThumbsUpAnimation({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0, rotate: 180 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="inline-flex items-center justify-center"
    >
      <ThumbsUp className="h-5 w-5 text-green-500" />
    </motion.div>
  );
}

// Smiley face animation for positive feedback
export function SmileyAnimation({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ 
        scale: [0, 1.2, 1],
        rotate: [0, 10, -10, 0]
      }}
      transition={{ 
        duration: 0.6,
        times: [0, 0.6, 1]
      }}
      className="inline-flex items-center justify-center"
    >
      <Smile className="h-5 w-5 text-yellow-500" />
    </motion.div>
  );
}

// Star rating animation
export function StarRatingAnimation({ rating, isAnimating }: { rating: number; isAnimating: boolean }) {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.div
          key={star}
          initial={isAnimating ? { scale: 0, rotate: -180 } : false}
          animate={isAnimating ? { 
            scale: star <= rating ? 1 : 0.8, 
            rotate: 0 
          } : {}}
          transition={{ 
            delay: isAnimating ? star * 0.1 : 0,
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
        >
          <Star 
            className={`h-6 w-6 ${
              star <= rating 
                ? "text-yellow-400 fill-current" 
                : "text-gray-300"
            } cursor-pointer transition-colors`}
          />
        </motion.div>
      ))}
    </div>
  );
}

// Floating success message
export function FloatingSuccessMessage({ 
  message, 
  isVisible, 
  onAnimationComplete 
}: { 
  message: string; 
  isVisible: boolean; 
  onAnimationComplete?: () => void;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ duration: 0.5 }}
          onAnimationComplete={onAnimationComplete}
          className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center space-x-2"
        >
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Typing indicator animation
export function TypingIndicator({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="flex items-center space-x-1 text-muted-foreground">
      <span className="text-sm">Saving</span>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
          }}
          className="text-sm"
        >
          .
        </motion.span>
      ))}
    </div>
  );
}