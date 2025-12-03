"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SignInButton, useUser } from "@clerk/nextjs"
import {
  ArrowRight,
  CheckCircle,
  Globe,
  Layers,
  Palette,
  Play,
  Smartphone,
  Star,
  Users,
  Zap
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function WelcomePage() {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/")
    }
  }, [isLoaded, isSignedIn, router])

  const features = [
    {
      icon: <Palette className="w-6 h-6" />,
      title: "Drag & Drop Editor",
      description: "Thiết kế giao diện trực quan với công cụ kéo thả dễ sử dụng"
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: "Responsive Design",
      description: "Tự động tối ưu cho mọi thiết bị từ desktop đến mobile"
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Component Library",
      description: "Thư viện components phong phú sẵn sàng sử dụng"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-time Preview",
      description: "Xem trước kết quả ngay lập tức khi thiết kế"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description: "Làm việc nhóm hiệu quả với tính năng chia sẻ dự án"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Export & Deploy",
      description: "Xuất code hoặc deploy trực tiếp lên hosting"
    }
  ]

  const testimonials = [
    {
      name: "Nguyễn Văn A",
      role: "UI/UX Designer",
      content: "Website Builder giúp tôi tạo ra các prototype nhanh chóng và chuyên nghiệp.",
      rating: 5
    },
    {
      name: "Trần Thị B",
      role: "Developer",
      content: "Công cụ tuyệt vời để tạo landing page mà không cần code phức tạp.",
      rating: 5
    },
    {
      name: "Lê Minh C",
      role: "Marketing Manager",
      content: "Dễ sử dụng, giao diện đẹp, và tính năng export code rất hữu ích.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl"></div>

        <div className="relative container mx-auto px-6 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo & Brand */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-2xl">
                <span className="text-primary-foreground font-bold text-2xl">WB</span>
              </div>
              <div className="text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  Website Builder
                </h1>
                <p className="text-primary font-medium">Professional Design Tool</p>
              </div>
            </div>

            {/* Main Heading */}
            <div className="mb-8">
              <Badge variant="secondary" className="mb-4 px-4 py-2">
                🚀 Công cụ thiết kế web thế hệ mới
              </Badge>
              <h2 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
                Tạo website{" "}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  chuyên nghiệp
                </span>
                {" "}chỉ trong vài phút
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                Không cần biết code, không cần kinh nghiệm thiết kế.
                Chỉ cần kéo, thả và tạo ra website đẹp mắt với Website Builder.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <SignInButton mode="redirect">
                <Button size="lg" className="px-8 py-4 text-lg font-semibold">
                  Bắt đầu thiết kế miễn phí
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </SignInButton>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg"
                onClick={() => setIsVideoPlaying(true)}
              >
                <Play className="w-5 h-5 mr-2" />
                Xem demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Websites được tạo</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">99%</div>
                <div className="text-sm text-muted-foreground">Khách hàng hài lòng</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Hỗ trợ kỹ thuật</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">✨ Tính năng nổi bật</Badge>
            <h3 className="text-4xl font-bold text-foreground mb-4">
              Mọi thứ bạn cần để tạo website hoàn hảo
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Từ thiết kế đến deploy, chúng tôi cung cấp đầy đủ công cụ chuyên nghiệp
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                    {feature.icon}
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">🛠️ Quy trình làm việc</Badge>
            <h3 className="text-4xl font-bold text-foreground mb-4">
              Chỉ 3 bước đơn giản
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary text-2xl font-bold">
                1
              </div>
              <h4 className="text-xl font-semibold mb-2">Chọn Template</h4>
              <p className="text-muted-foreground">Bắt đầu với template có sẵn hoặc tạo từ đầu</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary text-2xl font-bold">
                2
              </div>
              <h4 className="text-xl font-semibold mb-2">Tùy chỉnh</h4>
              <p className="text-muted-foreground">Kéo thả components và chỉnh sửa theo ý muốn</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary text-2xl font-bold">
                3
              </div>
              <h4 className="text-xl font-semibold mb-2">Xuất bản</h4>
              <p className="text-muted-foreground">Export code hoặc deploy trực tiếp lên web</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">💬 Khách hàng nói gì</Badge>
            <h3 className="text-4xl font-bold text-foreground mb-4">
              Được tin tùởng bởi hàng nghìn người dùng
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6 border-0 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="text-4xl font-bold text-foreground mb-4">
              Sẵn sàng tạo website đầu tiên?
            </h3>
            <p className="text-xl text-muted-foreground mb-8">
              Tham gia cùng hàng nghìn người dùng đang sử dụng Website Builder để tạo ra những website tuyệt vời
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <SignInButton mode="redirect">
                <Button size="lg" className="px-8 py-4 text-lg font-semibold">
                  Bắt đầu miễn phí ngay
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </SignInButton>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Miễn phí 14 ngày
              <CheckCircle className="w-4 h-4 text-green-500" />
              Không cần thẻ tín dụng
              <CheckCircle className="w-4 h-4 text-green-500" />
              Hủy bất cứ lúc nào
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-muted/20">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">WB</span>
              </div>
              <span className="text-lg font-semibold">Website Builder</span>
            </div>
            <p className="text-muted-foreground">
              © 2025 Website Builder. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}