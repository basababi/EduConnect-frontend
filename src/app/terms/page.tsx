import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Үйлчилгээний нөхцөл — EduConnect Mongolia",
  description: "EduConnect Mongolia платформ ашиглах үйлчилгээний нөхцөл.",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-primary">Үйлчилгээний нөхцөл</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Сүүлд шинэчилсэн: 2026 оны 7-р сар
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <section className="rounded-lg border border-amber/30 bg-amber/5 p-4 text-muted-foreground">
            Энэхүү нөхцөл нь ерөнхий загвар бөгөөд албан ёсны ашиглалтын өмнө хуульчаар
            эцэслэн батлуулахыг зөвлөж байна.
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Үйлчилгээний тухай</h2>
            <p className="mt-2 text-muted-foreground">
              EduConnect Mongolia нь сургалтын төвийн удирдлага, багш, эцэг эх, сурагчдад зориулсан
              боловсролын удирдлагын платформ юм. Платформыг ашигласнаар та эдгээр нөхцөлийг
              хүлээн зөвшөөрч байгаад тооцно.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Данс ба хариуцлага</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Хэрэглэгч нэвтрэх мэдээллээ нууц байлгах үүрэгтэй</li>
              <li>Данс нь тухайн сургалтын төвийн эрх бүхий этгээдээр үүсгэгдэнэ</li>
              <li>Бусдын мэдээлэлд зөвшөөрөлгүй хандахыг хориглоно</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Зөв ашиглалт</h2>
            <p className="mt-2 text-muted-foreground">
              Платформыг зөвхөн боловсролын зорилгоор ашиглана. Хууль бус үйлдэл, бусдын
              эрхийг зөрчих, системд халдах оролдлого хийхийг хатуу хориглоно.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">
              4. AI Tutor-ийн үнэлгээ
            </h2>
            <p className="mt-2 text-muted-foreground">
              AI Tutor нь суралцахуйг дэмжих туслах хэрэгсэл юм. Нээлттэй хариултын AI
              үнэлгээ нь <b>эцсийн биш</b> — багш эцэслэн баталгаажуулна. AI-ийн үр дүнг
              зөвлөмж болгон авч үзнэ.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Төлбөр</h2>
            <p className="mt-2 text-muted-foreground">
              Үйлчилгээний төлбөр, багц нь сургалтын төвтэй байгуулсан гэрээгээр тодорхойлогдоно.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Хариуцлагын хязгаар</h2>
            <p className="mt-2 text-muted-foreground">
              Платформыг &laquo;байгаа байдлаар&raquo; үзүүлнэ. Бид үйлчилгээг тасралтгүй
              сайжруулахаар хичээх боловч алдаа, тасалдлаас үүдэх шууд бус хохиролд
              хариуцлага хүлээхгүй.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Холбоо барих</h2>
            <p className="mt-2 text-muted-foreground">
              Асуулт, санал: <b>info@educonnect.mn</b>
            </p>
          </section>
        </div>

        <div className="mt-12 border-t pt-6">
          <Link href="/privacy" className="text-sm text-primary hover:underline">
            Нууцлалын бодлого →
          </Link>
        </div>
      </main>
    </div>
  );
}
