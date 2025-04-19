import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Database, MessageSquare, Code, ArrowRight, Terminal, CheckCircle } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="relative min-h-screen bg-gray-900">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-0 right-0 w-full h-full">
          <svg width="100%" height="100%" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="none" />
            <path d="M0 0L50 50M100 0L0 100M150 0L0 150M200 0L0 200M250 0L0 250M300 0L0 300" 
                  stroke="#4f46e5" strokeWidth="1" fill="none" opacity="0.3" />
            <path d="M0 0L50 50M100 0L0 100M150 0L0 150M200 0L0 200M250 0L0 250M300 0L0 300" 
                  stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.3" 
                  transform="translate(100, 0)" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <div className="flex flex-col items-center justify-center pt-24 pb-20 px-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-900 p-3 rounded-full">
              <Database className="text-indigo-300 w-10 h-10" />
            </div>
            <h1 className="text-5xl font-extrabold text-indigo-300">SpeakQL</h1>
          </div>
          <p className="text-xl text-gray-300 text-center max-w-2xl mb-10">
            Transform your database experience with natural language.
            <span className="block mt-2 font-light text-gray-400">Just speak, we'll write the SQL.</span>
          </p>
          <div className="flex gap-4 mb-16">
            <Button
              onClick={() => navigate('/login')}
              className="bg-gray-800 hover:bg-gray-700 text-gray-100 px-8 py-6 rounded-lg text-lg font-medium shadow-lg border border-gray-700"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate('/signup')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 rounded-lg text-lg font-medium shadow-lg"
            >
              Sign Up Free
            </Button>
          </div>
        </div>

        {/* Demo Section with Terminal UI */}
        <div className="max-w-4xl mx-auto py-10 px-4">
          <div className="bg-black rounded-xl shadow-2xl overflow-hidden border border-gray-800">
            {/* Terminal Header */}
            <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="ml-4 text-gray-400 text-sm">SpeakQL Terminal</div>
            </div>
            {/* Terminal Content */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Terminal size={16} className="text-green-400" />
                <span className="text-green-400 font-mono">speakql&gt;</span>
                <span className="text-white font-mono">Show me all customers who spent more than $1000 last month</span>
              </div>
              <div className="bg-gray-900 p-4 rounded-md mb-4">
                <div className="text-blue-400 font-mono mb-2">// Generating SQL Query...</div>
                <pre className="text-green-400 font-mono text-sm">
                  {`SELECT customers.name, SUM(orders.amount) as total_spent
FROM customers
JOIN orders ON customers.id = orders.customer_id
WHERE orders.date >= '2025-03-01' AND orders.date <= '2025-03-31'
GROUP BY customers.id
HAVING total_spent > 1000;`}
                </pre>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-green-400 font-mono">Query execution successful. Found 24 results.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto py-20 px-4">
          <h2 className="text-3xl font-bold text-center mb-14 text-gray-100">Why Choose SpeakQL</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MessageSquare className="w-8 h-8" />}
              title="Natural Language Queries"
              description="Ask questions in plain English and get SQL queries instantly"
            />
            <FeatureCard 
              icon={<Database className="w-8 h-8" />}
              title="Multiple Database Support"
              description="Works with MySQL, PostgreSQL, SQL Server, and more"
            />
            <FeatureCard 
              icon={<Code className="w-8 h-8" />}
              title="Query Optimization"
              description="Automatically optimizes generated SQL for better performance"
            />
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-gray-800 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16 text-gray-100">How SpeakQL Works</h2>
            <div className="grid md:grid-cols-3 gap-12">
              <WorkflowStep 
                number="01"
                title="Connect Your Database"
                description="Securely link SpeakQL to your database with just a few clicks. No complex setup required."
              />
              <WorkflowStep 
                number="02"
                title="Ask in Plain Language"
                description="Type or speak your query in natural language - just like you'd ask a colleague."
              />
              <WorkflowStep 
                number="03"
                title="Get Instant Results"
                description="SpeakQL translates your request into optimized SQL and returns your data immediately."
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-indigo-900 py-16">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to simplify your database workflow?</h2>
            <p className="text-indigo-200 mb-8">Join thousands of developers who are already talking to their databases.</p>
            <Button
              onClick={() => navigate('/signup')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-medium shadow-lg"
            >
              Get Started For Free
            </Button>
            <p className="text-indigo-300 mt-4 text-sm">No credit card required</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-black py-12">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Database className="text-indigo-400 w-6 h-6" />
              <span className="text-xl font-bold text-indigo-300">SpeakQL</span>
            </div>
            <nav className="flex gap-8 mb-4 md:mb-0">
              <a href="#" className="text-gray-400 hover:text-indigo-300">About</a>
              <a href="#" className="text-gray-400 hover:text-indigo-300">Documentation</a>
              <a href="#" className="text-gray-400 hover:text-indigo-300">Contact</a>
            </nav>
            <div className="text-gray-500 text-sm">
              © {new Date().getFullYear()} SpeakQL. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-700">
      <div className="text-indigo-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-100">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

const WorkflowStep = ({ number, title, description }: { number: string; title: string; description: string }) => {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="bg-indigo-900 w-14 h-14 rounded-full flex items-center justify-center mb-4">
        <span className="text-xl font-bold text-indigo-300">{number}</span>
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-100">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

export default HomePage;
