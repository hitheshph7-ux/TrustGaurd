import os
import re
from typing import Dict, Any, List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

# Synthetic training dataset for baseline ML model (0: Legitimate, 1: Phishing, 2: Spam)
TRAINING_DATA = [
    # Phishing (label 1)
    ("URGENT: Your account has been suspended immediately due to unauthorized activity. Click here to verify credentials.", 1),
    ("Action Required: Password expired. Please log in to update your password immediately.", 1),
    ("Security Alert: Unusual sign-in attempt detected. Verify your account now or face permanent suspension.", 1),
    ("Invoice Payment Overdue! Kindly update bank account details and wire payment to avoid legal action.", 1),
    ("Dear customer, your payroll direct deposit failed. Submit your banking credentials to update info.", 1),
    ("Important notice regarding your account termination. Click link below to retain your mailbox access.", 1),
    ("Wire transfer request from CEO. Please send $45,000 immediately to vendor account attached.", 1),
    ("Gift card purchase needed urgently for client presentation. Reply with gift card codes ASAP.", 1),
    ("Tax refund notification! Claim your pending $1,250 refund by confirming your Social Security Number.", 1),
    ("Immediate action required: Update billing credit card details to avoid immediate service cutoff.", 1),
    
    # Spam / Promotional (label 2)
    ("CONGRATULATIONS! You have been selected to win a free $1,000 gift card! Click here now to claim your prize!", 2),
    ("Unbeatable discount offer! Get 80% off brand name watches and designer items today only!", 2),
    ("Earn $5,000 per week working from home! No experience needed, instant payout guaranteed!", 2),
    ("Exclusive VIP Casino invitation! Get 50 free spins and 200% deposit bonus right now!", 2),
    ("Limited time offer: Cheap pharmacy deals, buy online without prescription with free shipping!", 2),
    ("ACT NOW! You won the grand lottery prize of $50,000. Claim your reward before deadline expires!", 2),
    ("Special promotion: Weight loss miracle pill, lose 20 lbs in 7 days guaranteed!", 2),
    ("Low interest loan approval! Get instant cash in your account within 10 minutes no credit check!", 2),
    ("FINAL CHANCE to claim your free trial subscription. Don't miss out on this crazy deal!", 2),
    ("Increase website traffic fast! Buy 100,000 real visitors for only $9.99 guaranteed results!", 2),

    # Legitimate / Safe (label 0)
    ("Weekly team status meeting scheduled for tomorrow at 10 AM in Conference Room B.", 0),
    ("Attached is the monthly financial report for Q3 review. Please let me know if you have questions.", 0),
    ("Thanks for sending over the project timeline. Everything looks good on our end.", 0),
    ("Reminder: Company picnic this Friday at Central Park. Please RSVP by Wednesday.", 0),
    ("Here is the updated draft of the product roadmap for next year.", 0),
    ("Software update v2.4 deployment notes: Security patches applied, system reboot complete.", 0),
    ("Invoice #INV-2024-889 from Acme Corp received. Approved for standard net-30 payment processing.", 0),
    ("Please find the requested design assets attached in ZIP format.", 0),
    ("Quarterly performance review discussions are now open in the HR portal.", 0),
    ("Lunch order for the team workshop has been placed. Delivery expected around noon.", 0)
]

class BaselinePhishingClassifier:
    """
    Scikit-learn based baseline classifier for email phishing and spam detection.
    Uses TF-IDF Vectorization and Multinomial Naive Bayes (Multiclass).
    """
    def __init__(self):
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', max_features=800)),
            ('clf', MultinomialNB())
        ])
        self.is_trained = False
        self._train()

    def _train(self):
        texts, labels = zip(*TRAINING_DATA)
        self.pipeline.fit(texts, labels)
        self.is_trained = True

    def predict(self, text: str) -> Dict[str, Any]:
        if not self.is_trained:
            self._train()
            
        clean_text = text.lower()
        probabilities = self.pipeline.predict_proba([clean_text])[0]
        
        # Classes: 0: Legitimate, 1: Phishing, 2: Spam
        legit_prob = float(probabilities[0])
        phishing_prob = float(probabilities[1])
        spam_prob = float(probabilities[2]) if len(probabilities) > 2 else 0.0

        # Class determination
        predicted_class_id = int(self.pipeline.predict([clean_text])[0])
        category_map = {0: "Legitimate", 1: "Phishing", 2: "Spam"}
        ml_category = category_map.get(predicted_class_id, "Legitimate")

        # Top features extraction
        tfidf = self.pipeline.named_steps['tfidf']
        feature_names = tfidf.get_feature_names_out()
        vectorized = tfidf.transform([clean_text])
        feature_indices = vectorized.nonzero()[1]
        
        top_words = [feature_names[idx] for idx in feature_indices[:5]]

        return {
            "ml_model_name": "Baseline NaiveBayes Multi-Class Classifier v2.0",
            "ml_category": ml_category,
            "phishing_probability": round(phishing_prob, 4),
            "phishing_score_pct": round(phishing_prob * 100, 1),
            "spam_probability": round(spam_prob, 4),
            "spam_score_pct": round(spam_prob * 100, 1),
            "legit_probability": round(legit_prob, 4),
            "contributing_features": top_words
        }

# Global singleton instance
phishing_ml_classifier = BaselinePhishingClassifier()
