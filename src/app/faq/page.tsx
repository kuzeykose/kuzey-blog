import React from 'react';
import SocialMedia from '@/components/SocialMedia';

type question = {
  question: string;
  answer: React.ReactNode;
};

export default async function About() {
  const questions: question[] = [
    {
      question: 'Sana nasıl hitap edelim?',
      answer: (
        <>
          Abi, hocam, kral, reis, dayı vb. gibi hitapları sevmiyorum. <strong> Kuzey </strong> demeniz yeterli; tecrübe
          ve yaşa takılmayın. Ben takılmıyorum.
        </>
      ),
    },
    {
      question: 'Yayınlarda ne yapıyorsun?',
      answer: (
        <>
          Dört tane içeriğimiz var;
          <ul className="list-disc px-10 py-2">
            <li>LeetCode problemleri çözüyoruz.</li>
            <li>Burası Bizim github organizasyonu altında projeler geliştiriyoruz.</li>
            <li>0'dan başlayaıp bir yayın içinde sizin o an kullanabileceğiniz uygulamalar/oyunlar geliştiriyoruz.</li>
            <li>'Haftalık' konseptinde soru & cevap yapıyoruz, soru ayırtmaksızın konuşuyoruz.</li>
          </ul>
          Eğer yayının başına gelirsen ve ilk defa kendinizi tanıtırsan bizden konfeti kazanırsın. 🎉
        </>
      ),
    },
    {
      question: 'Nasıl soru sormalıyım?',
      answer: (
        <>
          O an ne konuşuluyorsa o konu hakkında soru sormanda fayda var. Kafana takılan diğer konular olabilir, soru
          cevaplamaya her zaman açığım ama ChatGPT ya da internette hızlı bir arama ile bulabileceğin konuları
          sormamakta fayda var.
        </>
      ),
    },
    {
      question: 'Yazilima nasıl başlanır? / Yazılım nasıl öğrenilir?',
      answer: (
        <>
          Bunun hakkında sana tam olarak 11 dakika 53 saniyelik bir cevabım var.{' '}
          <a className="underline" href="https://www.youtube.com/watch?v=1-URp-oy1fI" target="_blank">
            Yazılıma, programlamaya nereden başlamalıyım, hangi dili öğrenmeliyim?
          </a>
        </>
      ),
    },
    {
      question: 'Yazılım için üniversite şart mı? matematik gereklimi?',
      answer: (
        <>
          Bunun hakkında sana tam olarak 14 dakika 06 saniyelik bir cevabım var.{' '}
          <a className="underline" href="https://www.youtube.com/watch?v=NAse2en4UVM&t=182s" target="_blank">
            Yazılım mühendisi olmak için üniversite şart mı? Matematik gerekli mi? | Portföy için 10 proje
          </a>
        </>
      ),
    },
    {
      question: 'Yazılım zor mu?',
      answer: <></>,
    },
    {
      question: 'Hangi programramlama dillerini öğrenmeliyim? Hangi dille başlamalıyım?',
      answer: <></>,
    },
    {
      question: 'Leetcode nedir? Günlük soru nedir? Haftalık soru nedir?',
      answer: <></>,
    },
    {
      question: '2 ayda yazılım öğrenilir mi?',
      answer: <></>,
    },
    {
      question: 'Kaç yaşındasın?',
      answer: <></>,
    },
    {
      question: 'Hangi üniversitede okudun? Ne okudun?',
      answer: <></>,
    },
    {
      question: 'Nerede yaşıyorsun?',
      answer: <></>,
    },
    {
      question: 'Hangi dillerle geliştirme yapıyorsun ?',
      answer: <></>,
    },
    {
      question: 'Spor yapıyor musun?',
      answer: <></>,
    },
  ];

  return (
    <section className="flex flex-col lg:block py-20">
      <div className="flex">
        <div className="space-y-12">
          <div className="w-[350px] md:w-full space-y-5">
            <h1 className="text-4xl font-bold">FAQs</h1>

            <div className="space-y-7">
              {questions.map((item) => (
                <div className="space-y-2">
                  <h2 className="font-semibold text-2xl">{item.question}</h2>
                  <div>{item.answer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
