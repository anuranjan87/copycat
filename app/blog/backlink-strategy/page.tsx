'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Link } from 'lucide-react'
import Header from "@/components/header2"

export default function BacklinkStrategy() {
  const [outreachEmail, setOutreachEmail] = useState('')
  const [completedTasks, setCompletedTasks] = useState<string[]>([])

  const strategies = [
    {
      title: "Create High-Quality Content",
      description: "Develop valuable, informative, and shareable content to attract backlinks naturally.",
      tasks: ["Brainstorm content ideas", "Create a content calendar", "Write and publish high-quality blog posts"]
    },
    {
      title: "Guest Blogging",
      description: "Reach out to established blogs in your niche and offer to write guest posts.",
      tasks: ["Identify potential guest blogging opportunities", "Pitch guest post ideas", "Write and submit guest posts"]
    },
    {
      title: "Directory Submissions",
      description: "Submit your website to relevant, high-quality business directories.",
      tasks: ["Research industry-specific directories", "Submit to local business listings", "Monitor and update directory listings"]
    },
    {
      title: "Outreach and Relationship Building",
      description: "Connect with bloggers, webmasters, and influencers in your industry.",
      tasks: ["Identify key influencers in your niche", "Engage with influencers on social media", "Propose collaboration opportunities"]
    },
    {
      title: "Social Media Sharing",
      description: "Share your content on various social media platforms to increase visibility.",
      tasks: ["Create social media accounts for your website", "Develop a social media content strategy", "Regularly share your content across platforms"]
    }
  ]

  const handleTaskCompletion = (task: string) => {
    if (completedTasks.includes(task)) {
      setCompletedTasks(completedTasks.filter(t => t !== task))
    } else {
      setCompletedTasks([...completedTasks, task])
    }
  }

  const generateOutreachEmail = () => {
    setOutreachEmail(`
Dear [Blogger's Name],

I hope this email finds you well. I'm [Your Name] from [Your Website], and I've been a long-time reader of your blog. I particularly enjoyed your recent post about [specific topic].

I'm reaching out because I've just published an in-depth article on [your article topic] that I think would be valuable to your readers. It covers [brief description of your content].

I thought you might be interested in checking it out and possibly sharing it with your audience if you find it helpful. You can find the article here: [Your URL]

Thank you for your time and consideration. I look forward to reading more of your insightful content.

Best regards,
[Your Name]
    `.trim())
  }

  return (
    <div className="container mx-auto p-4"><Header/><header>
      <h1 className="text-3xl font-bold mb-6 mt-12">Backlink Strategy for New Websites</h1></header>
      
      <Accordion type="single" collapsible className="mb-8">
        {strategies.map((strategy, index) => (
          <AccordionItem value={`item-${index}`} key={index}>
            <AccordionTrigger>{strategy.title}</AccordionTrigger>
            <AccordionContent>
              <p className="mb-4">{strategy.description}</p>
              <ul className="list-disc pl-5">
                {strategy.tasks.map((task, taskIndex) => (
                  <li key={taskIndex} className="mb-2 flex items-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleTaskCompletion(task)}
                      className={`mr-2 ${completedTasks.includes(task) ? 'text-green-500' : 'text-gray-500'}`}
                    >
                      <CheckCircle className={`h-5 w-5 ${completedTasks.includes(task) ? 'fill-current' : ''}`} />
                    </Button>
                    {task}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Outreach Email Generator</CardTitle>
          <CardDescription>Generate a template for your outreach emails</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generateOutreachEmail} className="mb-4">
            Generate Email Template
          </Button>
          <Textarea 
            value={outreachEmail} 
            onChange={(e) => setOutreachEmail(e.target.value)}
            placeholder="Your outreach email will appear here..."
            rows={10}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backlink Tracker</CardTitle>
          <CardDescription>Keep track of your acquired backlinks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="website">Website URL</Label>
              <Input id="website" placeholder="Enter the website URL" />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="anchor">Anchor Text</Label>
              <Input id="anchor" placeholder="Enter the anchor text" />
            </div>
            <Button className="w-full">
              <Link className="mr-2 h-4 w-4" /> Add Backlink
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

