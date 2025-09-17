'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export default function TestPage() {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-4xl font-bold mb-8">Component Test Page</h1>

      {/* Button Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Button Components</CardTitle>
          <CardDescription>Various button styles and states</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button variant="default" onClick={() => setClickCount(c => c + 1)}>
              Default (Clicked: {clickCount})
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex gap-4 flex-wrap">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </CardContent>
      </Card>

      {/* Input & Label Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Input & Label Components</CardTitle>
          <CardDescription>Form input elements with labels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="test-input">Test Input</Label>
            <Input
              id="test-input"
              type="text"
              placeholder="Type something..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">You typed: {inputValue}</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="disabled">Disabled Input</Label>
            <Input id="disabled" disabled placeholder="This is disabled" />
          </div>
        </CardContent>
      </Card>

      {/* Select Component */}
      <Card>
        <CardHeader>
          <CardTitle>Select Component</CardTitle>
          <CardDescription>Dropdown selection component</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="project">Select Project</Label>
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project-1">Project Alpha</SelectItem>
                <SelectItem value="project-2">Project Beta</SelectItem>
                <SelectItem value="project-3">Project Gamma</SelectItem>
                <SelectItem value="project-4">Project Delta</SelectItem>
              </SelectContent>
            </Select>
            {selectValue && (
              <p className="text-sm text-muted-foreground">Selected: {selectValue}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card Variations */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Basic Card</CardTitle>
            <CardDescription>A simple card component</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the card content area where you can place any content.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Card with Footer</CardTitle>
            <CardDescription>Includes a footer section</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here.</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Action Button</Button>
          </CardFooter>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Styled Card</CardTitle>
            <CardDescription>With custom border color</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This card has a primary colored border.</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Interactive Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Component Demo</CardTitle>
          <CardDescription>Test component interactions and state management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">Current State:</h3>
            <ul className="space-y-1 text-sm">
              <li>Button clicks: {clickCount}</li>
              <li>Input value: &quot;{inputValue}&quot;</li>
              <li>Selected project: {selectValue || 'None'}</li>
            </ul>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setClickCount(0);
              setInputValue('');
              setSelectValue('');
            }}
            className="w-full"
          >
            Reset All Values
          </Button>
        </CardContent>
      </Card>

      {/* Theme Test */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Colors</CardTitle>
          <CardDescription>MVP color scheme showcase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-full h-20 bg-primary rounded mb-2"></div>
              <p className="text-sm">Primary</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 bg-secondary rounded mb-2"></div>
              <p className="text-sm">Secondary</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 bg-positive rounded mb-2"></div>
              <p className="text-sm">Positive</p>
            </div>
            <div className="text-center">
              <div className="w-full h-20 bg-negative rounded mb-2"></div>
              <p className="text-sm">Negative</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}