import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Bot, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function TalkingBot({ items, totalAmount, amountGiven, change }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showBot, setShowBot] = useState(false);

  const speakSummary = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const itemCount = items.length;
    const hasPayment = amountGiven && parseFloat(amountGiven) > 0;

    let message = '';

    if (itemCount === 0) {
      message = 'Your cart is empty. Please add some items first.';
    } else {
      // List items
      message = `You have ${itemCount} ${itemCount === 1 ? 'item' : 'items'} in your cart. `;
      
      items.forEach((item, index) => {
        message += `${item.name} at ${item.price.toFixed(2)} rand. `;
