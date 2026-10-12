import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Нууцлалын бодлого — EduConnect Mongolia",
  description: "EduConnect Mongolia платформын хувийн мэдээлэл хамгаалах бодлого.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-foreground">EduConnect</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Нүүр
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-primary">Нууцлалын бодлого</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Сүүлд шинэчилсэн: 2026 оны 7-р сар
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <section className="rounded-lg border border-amber/30 bg-amber/5 p-4 text-muted-foreground">
            Энэхүү бодлого нь ерөнхий загвар бөгөөд Монгол Улсын{" "}
            <b>&laquo;Хүний хувийн мэдээлэл хамгаалах тухай&raquo;</b> хууль болон
            холбогдох журмын дагуу хуульчаар эцэслэн батлуулахыг зөвлөж байна.
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Ерөнхий заалт</h2>
            <p className="mt-2 text-muted-foreground">
              EduConnect Mongolia (&laquo;Платформ&raquo;) нь сургалтын төвийн удирдлага, багш,
              эцэг эх, сурагчдад зориулсан боловсролын үйлчилгээ юм. Бид хэрэглэгчийн хувийн
              мэдээллийг хамгаалахыг эрхэмлэнэ. Сургалтын төв нь өгөгдлийн{" "}
              <b>эзэмшигч (data controller)</b>, Платформ нь{" "}
              <b>боловсруулагч (data processor)</b> үүрэгтэй.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              2. Цуглуулах мэдээлэл
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Хэрэглэгчийн нэр, имэйл, дүр (багш/эцэг эх/сурагч/админ)</li>
              <li>Сурагчийн боловсролын мэдээлэл: дүн, ирц, даалгавар, шалгалтын үр дүн</li>
              <li>Эцэг эх–сурагчийн холбоо</li>
              <li>Платформ ашиглалтын лог (аюулгүй байдал, сайжруулалтад)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              3. Хэрэглээ ба зорилго
            </h2>
            <p className="mt-2 text-muted-foreground">
              Мэдээллийг зөвхөн боловсролын үйлчилгээ үзүүлэх — дүн/ирц хөтлөх, эцэг эхэд
              мэдээлэх, сурагчийн хувийн суралцахуйг дэмжих (AI Tutor) зорилгоор ашиглана.
              Бид хувийн мэдээллийг <b>зарж борлуулахгүй</b>, зар сурталчилгаанд ашиглахгүй.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              4. Насанд хүрээгүй хүүхдийн мэдээлэл
            </h2>
            <p className="mt-2 text-muted-foreground">
              Насанд хүрээгүй сурагчийн мэдээллийг сургалтын төв болон эцэг эхийн
              зөвшөөрлийн хүрээнд боловсруулна. Эцэг эх хүүхдийнхээ мэдээллийг үзэх,
              засварлуулах, устгуулах эрхтэй.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              5. Хамгаалалт ба хадгалалт
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Бүх холболт HTTPS-ээр шифрлэгдэнэ; нууц үг hash хэлбэрээр хадгалагдана</li>
              <li>Дүрд суурилсан хандалтын хяналт (RBAC) — хэрэглэгч зөвхөн эрхийнхээ хүрээнд</li>
              <li>Сургалтын төв бүрийн мэдээлэл тусгаарлагдсан (multi-tenant)</li>
              <li>Мэдээллийг зөвхөн үйлчилгээ үзүүлэх шаардлагатай хугацаанд хадгална</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              6. Гуравдагч тал
            </h2>
            <p className="mt-2 text-muted-foreground">
              Платформ нь дараах үйлчилгээ үзүүлэгчдийг ашигладаг: сервер байршуулалт
              (Railway, Vercel), AI боловсруулалт (Google Gemini — зөвхөн боловсролын
              агуулга, хувийн танихуйц мэдээлэлгүй). Эдгээр нь өөрсдийн нууцлалын бодлоготой.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              7. Таны эрх
            </h2>
            <p className="mt-2 text-muted-foreground">
              Та өөрийн (эсвэл асрамжид байгаа хүүхдийн) мэдээллийг үзэх, засварлуулах,
              устгуулах хүсэлт гаргах эрхтэй. Хүсэлтээ доорх хаягаар илгээнэ үү.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Холбоо барих</h2>
            <p className="mt-2 text-muted-foreground">
              Нууцлалтай холбоотой асуулт: <b>info@educonnect.mn</b>
            </p>
          </section>
        </div>

        <div className="mt-12 border-t pt-6">
          <Link href="/terms" className="text-sm text-primary hover:underline">
            Үйлчилгээний нөхцөл →
          </Link>
        </div>
      </main>
    </div>
  );
}
