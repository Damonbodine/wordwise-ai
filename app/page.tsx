import { Layout } from '@/components/layout/layout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TextEditor } from '@/components/editor/text-editor'

export default function Home() {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Welcome to WordWise AI
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the future of writing with our intelligent assistant. 
            Create, edit, and perfect your content with AI-powered suggestions.
          </p>
        </div>

        {/* Text Editor Section */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              Rich Text Editor
            </CardTitle>
            <CardDescription>
              Try our advanced TipTap editor with real-time word count, character tracking, and intelligent formatting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TextEditor 
              placeholder="Start writing your masterpiece here..." 
              className="w-full"
            />
          </CardContent>
        </Card>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                Smart Grammar
              </CardTitle>
              <CardDescription>
                Advanced AI detects and corrects grammar mistakes in real-time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                Style Enhancement
              </CardTitle>
              <CardDescription>
                Improve clarity, tone, and readability with intelligent suggestions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                Real-time Analysis
              </CardTitle>
              <CardDescription>
                Get instant feedback as you type with lightning-fast processing
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Start Section */}
        <Card className="border-border/50 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Test our components and see the elegant design in action
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Try typing something here..."
                className="flex-1"
                label="Sample Input"
                helperText="This is our custom Input component"
              />
              <div className="flex gap-2">
                <Button variant="primary">
                  Primary
                </Button>
                <Button variant="secondary">
                  Secondary
                </Button>
                <Button variant="ghost">
                  Ghost
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button loading={true} disabled>
                Processing...
              </Button>
              <Button variant="destructive" size="sm">
                Small
              </Button>
              <Button variant="primary" size="lg">
                Large Button
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Component Showcase */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Input Variants</CardTitle>
              <CardDescription>Different input states and configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Default Input" placeholder="Enter text..." />
              <Input 
                label="Input with Error" 
                placeholder="This has an error" 
                error="This field is required"
              />
              <Input 
                label="Input with Helper" 
                placeholder="Helpful input" 
                helperText="This is some helpful information"
              />
              <Input label="Small Input" placeholder="Small size" inputSize="sm" />
              <Input label="Large Input" placeholder="Large size" inputSize="lg" />
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Layout Features</CardTitle>
              <CardDescription>Try the sidebar and responsive features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Collapsible sidebar (try the toggle button)</p>
                <p>• Responsive mobile menu (resize window or check mobile)</p>
                <p>• Elegant backdrop blur effects</p>
                <p>• Gradient overlays and subtle animations</p>
                <p>• Professional card layouts</p>
              </div>
              <Button className="w-full">
                Start Writing
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
} 