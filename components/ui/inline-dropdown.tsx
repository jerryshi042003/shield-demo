'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InlineDropdownProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function InlineDropdown({ title, children, className = '' }: InlineDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      {/* Header with title and dropdown toggle */}
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-section-heading text-text-primary">{title}</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent focus:bg-accent focus:outline-none"
          aria-expanded={isOpen}
          aria-controls="glossary-content"
        >
          <span>View Terms</span>
          <ChevronDown 
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>
      </div>

      {/* Dropdown content with animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="glossary-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -10 }}
              animate={{ y: 0 }}
              exit={{ y: -10 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 