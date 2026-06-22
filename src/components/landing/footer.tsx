"use client";

import { GraduationCap, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" className="border-t border-border/50 bg-muted/30">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                EduConnect
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Монголын сургуулиудад зориулсан нэгдсэн дижитал платформ
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Платформ</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Боломжууд</a></li>
              <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Үнийн санал</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Демо үзэх</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">Компани</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Бидний тухай</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Блог</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Ажлын байр</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Холбоо</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-accent" />
                +976 11-123456
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-accent" />
                info@educonnect.mn
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-accent" />
                Улаанбаатар, Монгол
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/50 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 EduConnect Mongolia. Бүх эрх хуулиар хамгаалагдсан.
          </p>
          <div className="flex gap-6 text-xs">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Нууцлалын бодлого</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Үйлчилгээний нөхцөл</a>
          </div>
        </div>
      </div>
    </footer>
  );
}