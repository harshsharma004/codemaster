import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen font-sans bg-background text-foreground py-24 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link to="/" className="text-primary hover:underline font-medium text-sm">
          &larr; Back to Home
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold border-b pb-2 mb-4">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information you provide directly to us when you create an account, update your profile, or interact with the platform. This includes your name, email address, and any coding statistics or content you choose to submit.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold border-b pb-2 mb-4">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the information we collect to operate, maintain, and provide the features and functionality of the platform. We may also use it to communicate with you about your account, updates, and promotional offers.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold border-b pb-2 mb-4">3. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement reasonable security measures designed to protect your information from unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-bold border-b pb-2 mb-4">4. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us.
            </p>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
