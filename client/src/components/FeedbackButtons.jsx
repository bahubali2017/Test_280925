import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

/**
 * Feedback buttons component for AI responses
 * @param {Object} props - Component props
 * @param {string} props.messageId - ID of the message being rated
 * @param {string} props.sessionId - Current session ID
 * @param {string} props.userQuery - Original user question
 * @param {string} props.aiResponse - AI response content
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Feedback buttons component
 */
export function FeedbackButtons({ 
  messageId, 
  sessionId, 
  userQuery, 
  aiResponse, 
  className = '' 
}) {
  const [feedback, setFeedback] = useState(null); // 'helpful' or 'could_improve'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFeedback = async (feedbackType) => {
    if (isSubmitting || feedback) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    
    try {
      await apiRequest('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          messageId,
          sessionId,
          userId: 'anonymous', // Default for now
          feedbackType,
          userQuery,
          aiResponse,
          userRole: 'general_public',
          responseMetadata: JSON.stringify({
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          })
        })
      });

      setFeedback(feedbackType);
      
      toast({
        title: feedbackType === 'helpful' ? 'Thank you!' : 'Feedback received',
        description: feedbackType === 'helpful' 
          ? 'Your feedback helps us improve our responses.'
          : 'We appreciate your feedback and will work to improve.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 mt-2 ${className}`}>
      <span className="text-sm text-muted-foreground">Was this helpful?</span>
      
      <button
        onClick={() => handleFeedback('helpful')}
        disabled={isSubmitting || feedback}
        className={`
          flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-all
          ${feedback === 'helpful' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'hover:bg-green-50 text-muted-foreground hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400'
          }
          ${(isSubmitting || feedback) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
        data-testid="feedback-helpful"
      >
        <ThumbsUp className="w-4 h-4" />
        <span>Yes</span>
      </button>

      <button
        onClick={() => handleFeedback('could_improve')}
        disabled={isSubmitting || feedback}
        className={`
          flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-all
          ${feedback === 'could_improve' 
            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' 
            : 'hover:bg-orange-50 text-muted-foreground hover:text-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-400'
          }
          ${(isSubmitting || feedback) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
        data-testid="feedback-could-improve"
      >
        <ThumbsDown className="w-4 h-4" />
        <span>No</span>
      </button>

      {feedback && (
        <span className="text-xs text-muted-foreground ml-2">
          Feedback submitted
        </span>
      )}
    </div>
  );
}