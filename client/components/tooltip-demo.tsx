"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Download, HelpCircle, Info, Settings, Star } from "lucide-react"

export function TooltipDemo() {
  return (
    <div className="p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Tooltip Demo với Hover Effects</h1>
        <p className="text-muted-foreground">Hover vào các elements bên dưới để xem tooltip với hiệu ứng đẹp mắt</p>
      </div>

      {/* Basic Tooltips */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Tooltips</CardTitle>
          <CardDescription>Các tooltip cơ bản với hover effects</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">
                  <Info className="w-4 h-4 mr-2" />
                  Hover me
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Đây là tooltip với hiệu ứng hover đẹp mắt!</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Help
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Tooltip ở bên phải với glow effect</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive">
                  <Star className="w-4 h-4 mr-2" />
                  Star
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Tooltip ở dưới với animation mượt mà</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      {/* Different Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Tooltip Positions</CardTitle>
          <CardDescription>Tooltip ở các vị trí khác nhau</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8 place-items-center">
            {/* Top */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Top</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover Top</Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Tooltip ở trên với slide animation</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Bottom */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Bottom</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover Bottom</Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Tooltip ở dưới với fade effect</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Left */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Left</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover Left</Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Tooltip ở trái với zoom effect</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Right */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Right</h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover Right</Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Tooltip ở phải với glow effect</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Elements</CardTitle>
          <CardDescription>Các elements tương tác với tooltip</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-help hover:scale-110 transition-transform duration-200">
                  <Settings className="w-6 h-6 text-white" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Settings với gradient background</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg cursor-help transition-all duration-200 hover:shadow-lg hover:scale-105">
                  <Download className="w-4 h-4 inline mr-2" />
                  Download
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Download button với hover effects</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-16 h-16 border-2 border-dashed border-primary rounded-lg flex items-center justify-center cursor-help hover:border-solid hover:bg-primary/10 transition-all duration-200">
                  <span className="text-primary font-medium">?</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Custom styled element với dashed border</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      {/* Long Content Tooltip */}
      <Card>
        <CardHeader>
          <CardTitle>Long Content Tooltips</CardTitle>
          <CardDescription>Tooltip với nội dung dài</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">
                  <Info className="w-4 h-4 mr-2" />
                  Long Content
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium mb-2">Tooltip với nội dung dài</p>
                <p className="text-xs text-muted-foreground">
                  Đây là một tooltip với nội dung dài để test khả năng hiển thị và responsive của component. 
                  Tooltip sẽ tự động điều chỉnh kích thước và vị trí để phù hợp với màn hình.
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary">
                  <Star className="w-4 h-4 mr-2" />
                  Multi-line
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-sm">
                <div className="space-y-2">
                  <p className="font-medium">Multi-line Tooltip</p>
                  <p className="text-xs text-muted-foreground">
                    Tooltip này có nhiều dòng text để test khả năng hiển thị.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Có thể chứa nhiều đoạn văn bản khác nhau.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
