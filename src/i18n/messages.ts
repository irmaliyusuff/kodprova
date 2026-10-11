// Interface copy in Turkish and English, keyed by the copy deck's ids.
// Generated from the approved copy decks (v1.1, and v1.1 of the Data page deck,
// which also replaces two v1.1 lines); the text is placed unchanged, so fix
// wording in the deck and regenerate rather than editing here.
// {slot} placeholders are filled in by translate() (see translate.ts).

export const messages = {
  "ortak.atla": { tr: "İçeriğe geç", en: "Skip to content" },
  "ortak.menu.sorular": { tr: "Sorular", en: "Questions" },
  "ortak.menu.ilerleme": { tr: "İlerleme", en: "Progress" },
  "ortak.menu.hazirlandi": { tr: "Nasıl hazırlandı", en: "How it's made" },
  "ortak.menu.ac": { tr: "Menü", en: "Menu" },
  "ortak.dil.etiket": { tr: "Arayüz dili", en: "Interface language" },
  "ortak.dil.tr": { tr: "Türkçe", en: "Türkçe" },
  "ortak.dil.en": { tr: "English", en: "English" },
  "ortak.dil.kisa": { tr: "TR", en: "EN" },
  "ortak.alt.lisans": {
    tr: "Kod ve sorular MIT lisanslı.",
    en: "Code and questions are MIT-licensed.",
  },
  "ortak.alt.kaynak": { tr: "Kaynak kodu", en: "Source code" },
  "ortak.alt.yapan": {
    tr: "Hazırlayan: Yusuf Irmalı",
    en: "Made by Yusuf Irmalı",
  },
  "ortak.depolama.uyari": {
    tr: "İlerlemen bu tarayıcıda kaydedilemiyor; gizli pencere ya da kapalı depolama buna yol açabilir. Sorular yine çalışır.",
    en: "Your progress can't be saved in this browser; a private window or blocked storage may be the cause. The questions still work.",
  },
  "ortak.depolama.kapat": { tr: "Uyarıyı kapat", en: "Dismiss notice" },
  "ortak.yukleniyor": { tr: "Yükleniyor", en: "Loading" },
  "ortak.hata.yukleme": {
    tr: "Soru yüklenemedi. Sayfayı yenile; sorun sürerse bildir.",
    en: "The question didn't load. Refresh the page; if it keeps happening, report it.",
  },
  "ortak.hata.yenile": { tr: "Sayfayı yenile", en: "Refresh the page" },
  "ortak.noscript": {
    tr: "Bu site JavaScript ile çalışır; tarayıcında açık olmalı.",
    en: "This site runs on JavaScript; please turn it on in your browser.",
  },
  "ortak.yeniSekme": {
    tr: "(yeni sekmede açılır)",
    en: "(opens in a new tab)",
  },
  "sekme.giris": {
    tr: "{urun.ad} · Yapay zekâ kodunda hata bulma pratiği",
    en: "{urun.ad} · Practice finding bugs in AI-written code",
  },
  "sekme.liste": { tr: "Sorular · {urun.ad}", en: "Questions · {urun.ad}" },
  "sekme.soru": {
    tr: "Soru {no}: {soru.baslik} · {urun.ad}",
    en: "Question {no}: {soru.baslik} · {urun.ad}",
  },
  "sekme.sonuc": {
    tr: "Sonuç · Soru {no} · {urun.ad}",
    en: "Result · Question {no} · {urun.ad}",
  },
  "sekme.ilerleme": { tr: "İlerleme · {urun.ad}", en: "Progress · {urun.ad}" },
  "sekme.hazirlandi": {
    tr: "Sorular nasıl hazırlandı · {urun.ad}",
    en: "How the questions are made · {urun.ad}",
  },
  "sekme.bulunamadi": {
    tr: "Sayfa bulunamadı · {urun.ad}",
    en: "Page not found · {urun.ad}",
  },
  "giris.ust": {
    tr: "Mülakat hazırlığı · Kod inceleme",
    en: "Interview practice · Code review",
  },
  "giris.h1": {
    tr: "Yapay zekânın yazdığı koddaki hatayı bul, mülakattaki gibi anlat.",
    en: "Find the bug in AI-written code. Explain it the way an interview expects.",
  },
  "giris.tanim": {
    tr: "Mülakata hazırlananlar için pratik: yapay zekânın yazdığı kısa koddaki gizli hatayı bul, önemini ve nedenini söyle, hangi testin kanıtlayacağını seç.",
    en: "Practice for interview prep: find the hidden bug in short AI-written code, say how serious it is and why, and pick the test that proves it.",
  },
  "giris.kunye": {
    tr: "{kunye.soru} soru · 4 konu · Türkçe ve İngilizce · Hesap yok, ücretsiz",
    en: "{kunye.soru} questions · 4 topics · Turkish and English · No account, free",
  },
  "giris.cta.birincil": {
    tr: "İlk soruya başla",
    en: "Start the first question",
  },
  "giris.cta.ikincil": { tr: "Tüm sorular", en: "All questions" },
  "giris.nasil.baslik": { tr: "Nasıl çalışır", en: "How it works" },
  "giris.adim.1.baslik": { tr: "Oku", en: "Read" },
  "giris.adim.1.metin": {
    tr: "Yapay zekâya verilen görevi, yazdığı kodu ve kendinden emin teslim notunu oku. Kodda bir ya da iki gizli hata var.",
    en: "Read the task the AI was given, the code it wrote and its confident handoff note. The code hides one or two bugs.",
  },
  "giris.adim.2.baslik": {
    tr: "İşaretle ve gerekçele",
    en: "Mark and explain",
  },
  "giris.adim.2.metin": {
    tr: "Hatalı bulduğun satırları işaretle, her birine önem seç ve nedenini bir cümleyle yaz. Sonra hatayı kanıtlayacak testi seç.",
    en: "Mark the lines you think are wrong, give each a severity and a one-sentence reason. Then pick the test that would prove the bug.",
  },
  "giris.adim.3.baslik": { tr: "Karşılaştır", en: "Compare" },
  "giris.adim.3.metin": {
    tr: "Neyi bulduğunu, neyi kaçırdığını ve yanlış alarmlarını gör; gerekçeni örnek mülakat cevabıyla karşılaştır.",
    en: "See what you found, what you missed and any false alarms; compare your reasoning with a sample interview answer.",
  },
  "giris.puanlama": {
    tr: "Sonucu sabit kurallar belirler; cevabını yapay zekâ değerlendirmez.",
    en: "Fixed rules decide the result; no AI grades your answer.",
  },
  "giris.baglanti.hazirlandi": {
    tr: "Sorular nasıl hazırlandı",
    en: "How the questions are made",
  },
  "onem.baslik": { tr: "Önem nasıl seçilir", en: "How to pick a severity" },
  "onem.kritik.ad": { tr: "Kritik", en: "Critical" },
  "onem.kritik.tanim": {
    tr: "Veri kaybı, güvenlik açığı ya da para kaybı",
    en: "Data loss, a security hole or lost money",
  },
  "onem.onemli.ad": { tr: "Önemli", en: "Major" },
  "onem.onemli.tanim": {
    tr: "Kullanıcı yanlış sonuç alır",
    en: "The user gets a wrong result",
  },
  "onem.kucuk.ad": { tr: "Küçük", en: "Minor" },
  "onem.kucuk.tanim": {
    tr: "Uç durum ya da okunurluk",
    en: "An edge case or readability",
  },
  "liste.baslik": { tr: "Sorular", en: "Questions" },
  "liste.alt": {
    tr: "4 konu; her konuda sorular kolaydan zora sıralı.",
    en: "4 topics; within each, questions go from easy to hard.",
  },
  "liste.ozet": {
    tr: "{c}/{kunye.soru} soru çözüldü",
    en: "{c} of {kunye.soru} questions solved",
  },
  "liste.filtre.etiket": { tr: "Konu", en: "Topic" },
  "konu.web.ad": { tr: "Web / frontend", en: "Web / frontend" },
  "konu.api.ad": { tr: "API / backend", en: "API / backend" },
  "konu.guvenlik.ad": { tr: "Güvenlik", en: "Security" },
  "konu.test.ad": { tr: "Test", en: "Testing" },
  "konu.web.tanim": {
    tr: "Tarayıcıda çalışan kod: olaylar, formlar, arayüz durumu.",
    en: "Code that runs in the browser: events, forms, UI state.",
  },
  "konu.api.tanim": {
    tr: "Sunucu tarafı kod: uç noktalar, veri ve yeniden deneme.",
    en: "Server-side code: endpoints, data and retries.",
  },
  "konu.guvenlik.tanim": {
    tr: "Güven sınırları, girdi doğrulama ve veri sızıntısı.",
    en: "Trust boundaries, input validation and data leaks.",
  },
  "konu.test.tanim": {
    tr: "Testin kendisindeki hatalar: hiçbir şeyi doğrulamayan test, hatayı gizleyen sahte nesne, zamana bağlı kırılgan test.",
    en: "Bugs in the tests themselves: a test that asserts nothing, a mock that hides the bug, a time-dependent flaky test.",
  },
  "liste.kart.no": { tr: "Soru {no}", en: "Question {no}" },
  "liste.kart.zorluk": { tr: "Zorluk {z}/5", en: "Difficulty {z}/5" },
  "liste.kart.satir": { tr: "{n} satır", en: "{n} lines" },
  "liste.kart.dil.ts": { tr: "TypeScript", en: "TypeScript" },
  "liste.kart.dil.js": { tr: "JavaScript", en: "JavaScript" },
  "liste.kart.dil.py": { tr: "Python", en: "Python" },
  "liste.kart.cozulmedi": { tr: "Çözülmedi", en: "Not solved" },
  "liste.kart.bitti": {
    tr: "Bitti · {b}/{t} hata bulundu",
    en: "Done · {b} of {t} bugs found",
  },
  "koken.gercek": {
    tr: "Gerçek proje (anonim)",
    en: "Real project (anonymized)",
  },
  "koken.kurgu": { tr: "Kurgu", en: "Fictional" },
  "soru.kunye": {
    tr: "{konu} · Zorluk {z}/5 · {dil} · {n} satır",
    en: "{konu} · Difficulty {z}/5 · {dil} · {n} lines",
  },
  "soru.koken.etiket": { tr: "Köken", en: "Origin" },
  "soru.gorev.baslik": { tr: "Görev", en: "Task" },
  "soru.gorev.alt": {
    tr: "Yapay zekâdan istenen",
    en: "What the AI was asked to do",
  },
  "soru.kod.baslik": {
    tr: "Yapay zekânın yazdığı kod",
    en: "The code the AI wrote",
  },
  "soru.not.baslik": { tr: "Teslim notu", en: "Handoff note" },
  "soru.not.alt": {
    tr: "Yapay zekâ kodu teslim ederken şunu yazdı:",
    en: "What the AI wrote when it handed over the code:",
  },
  "soru.kaydir": {
    tr: "Kod yana kayar; satırın tamamı için kaydır.",
    en: "The code scrolls sideways; swipe to see a full line.",
  },
  "soru.yonerge": {
    tr: "Hatalı bulduğun satırları işaretle; her işarete önem seç ve nedenini bir cümleyle yaz.",
    en: "Mark the lines you think are wrong; give each mark a severity and a one-sentence reason.",
  },
  "soru.ipucu": {
    tr: "Satıra tıkla ya da dokun. Klavyede satıra gidip Enter'a bas.",
    en: "Click or tap a line. With a keyboard, move to the line and press Enter.",
  },
  "soru.sayac": { tr: "{n}/5 işaret", en: "{n} of 5 marks" },
  "isaret.baslik": { tr: "Satır {n}", en: "Line {n}" },
  "isaret.onem.etiket": { tr: "Önem", en: "Severity" },
  "isaret.onem.yardim": {
    tr: "Önem nasıl seçilir",
    en: "How to pick a severity",
  },
  "isaret.gerekce.etiket": {
    tr: "Gerekçe (isteğe bağlı)",
    en: "Reason (optional)",
  },
  "isaret.gerekce.ipucu": {
    tr: "Bir cümle: ne bozuluyor, kim etkileniyor?",
    en: "One sentence: what breaks, and who is affected?",
  },
  "isaret.gerekce.sayac": { tr: "{n}/280", en: "{n}/280" },
  "isaret.gerekce.not": {
    tr: "Gerekçe puanlanmaz; sonuçta örnek cevapla karşılaştırırsın.",
    en: "Your reason isn't graded; you'll compare it with a sample answer.",
  },
  "isaret.kaldir": { tr: "İşareti kaldır", en: "Remove mark" },
  "isaret.hata.onem": {
    tr: "Bu işaret için önem seç.",
    en: "Pick a severity for this mark.",
  },
  "isaret.hata.limit": {
    tr: "En fazla 5 satır işaretleyebilirsin. Önce bir işareti kaldır.",
    en: "You can mark up to 5 lines. Remove a mark first.",
  },
  "test.baslik": { tr: "Kanıtlayan test", en: "The test that proves it" },
  "test.yardim": {
    tr: "Doğru seçenek, bu kodda başarısız olan, yani hatayı ortaya çıkaran testtir.",
    en: "The right option is the test that fails on this code, which means it exposes the bug.",
  },
  "test.secenek.etiket": { tr: "Test seçenekleri", en: "Test options" },
  "test.hata": { tr: "Bir test seç.", en: "Choose a test." },
  "soru.gonder": { tr: "Cevabı gönder", en: "Submit answer" },
  "gonder.engel.isaret": {
    tr: "Göndermek için en az bir satır işaretle.",
    en: "Mark at least one line to submit.",
  },
  "gonder.engel.onem": {
    tr: "Önem seçilmemiş işaret var: satır {n}.",
    en: "A mark has no severity yet: line {n}.",
  },
  "gonder.engel.test": {
    tr: "Göndermek için bir test seç.",
    en: "Choose a test to submit.",
  },
  "soru.cozuldu.not": {
    tr: "Bu soruyu daha önce çözdün.",
    en: "You've solved this question before.",
  },
  "soru.cozuldu.gor": { tr: "Sonucunu gör", en: "See your result" },
  "soru.bastan": { tr: "Baştan çöz", en: "Solve again" },
  "soru.bastan.not": {
    tr: "İşaretlerin temizlendi. Önceki sonucun, yeniden gönderene kadar kayıtlı kalır.",
    en: "Your marks are cleared. Your previous result stays saved until you submit again.",
  },
  "sonuc.baslik": { tr: "Sonuç", en: "Result" },
  "sonuc.ozet.1.1": { tr: "Hatayı buldun.", en: "You found the bug." },
  "sonuc.ozet.1.0": { tr: "Hatayı kaçırdın.", en: "You missed the bug." },
  "sonuc.ozet.2.2": { tr: "İki hatayı da buldun.", en: "You found both bugs." },
  "sonuc.ozet.2.1": {
    tr: "İki hatadan birini buldun.",
    en: "You found one of the two bugs.",
  },
  "sonuc.ozet.2.0": {
    tr: "İki hatayı da kaçırdın.",
    en: "You missed both bugs.",
  },
  "sonuc.alarm.0": { tr: "Yanlış alarm yok.", en: "No false alarms." },
  "sonuc.alarm.1": { tr: "1 yanlış alarm.", en: "1 false alarm." },
  "sonuc.alarm.n": { tr: "{y} yanlış alarm.", en: "{y} false alarms." },
  "sonuc.test.dogru": {
    tr: "Test seçimin doğru.",
    en: "You chose the right test.",
  },
  "sonuc.test.yanlis": {
    tr: "Test seçimin doğru değil. Doğrusu aşağıda.",
    en: "That wasn't the right test. The right one is below.",
  },
  "sonuc.hata.baslik": {
    tr: "Hata {i} · satır {a}–{b}",
    en: "Bug {i} · lines {a}–{b}",
  },
  "sonuc.hata.baslik.tek": {
    tr: "Hata {i} · satır {a}",
    en: "Bug {i} · line {a}",
  },
  "durum.bulundu": { tr: "Bulundu", en: "Found" },
  "durum.kacti": { tr: "Kaçtı", en: "Missed" },
  "durum.alarm": { tr: "Yanlış alarm", en: "False alarm" },
  "sonuc.onem.dogru": { tr: "Doğru önem", en: "Expected severity" },
  "sonuc.onem.senin": { tr: "Senin seçimin", en: "Your choice" },
  "sonuc.onem.yok": { tr: "İşaretlemedin", en: "Not marked" },
  "sonuc.onem.esit": { tr: "Aynı", en: "Same" },
  "sonuc.onem.farkli": { tr: "Farklı", en: "Different" },
  "sonuc.aciklama.baslik": { tr: "Açıklama", en: "Explanation" },
  "sonuc.duzeltme.baslik": { tr: "Düzeltilmiş kod", en: "Fixed code" },
  "sonuc.duzeltme.not": {
    tr: "Değişen satırlar vurgulu.",
    en: "Changed lines are highlighted.",
  },
  "sonuc.gerekce.baslik": { tr: "Senin gerekçen", en: "Your reason" },
  "sonuc.gerekceler.baslik": { tr: "Senin gerekçelerin", en: "Your reasons" },
  "sonuc.gerekce.bos": {
    tr: "Gerekçe yazmadın. Mülakatta bunu söylemen gerekirdi.",
    en: "You didn't write a reason. In an interview, you'd need to say this.",
  },
  "sonuc.alarm.baslik": {
    tr: "Yanlış alarm · satır {n}",
    en: "False alarm · line {n}",
  },
  "sonuc.alarm.metin": {
    tr: "Bu satır tanımlı hataların aralığında değil. Soru, cevabı görmeden çözülerek denetlendi; başka bir hata bulunmadı.",
    en: "This line isn't inside any defined bug's range. The question was checked by a blind solve, and no other bug was found.",
  },
  "sonuc.alarm.itiraz": {
    tr: "Burada gerçek bir hata görüyorsan bildir.",
    en: "If you see a real bug here, report it.",
  },
  "sonuc.test.baslik": { tr: "Kanıtlayan test", en: "The test that proves it" },
  "sonuc.test.dogruEtiket": { tr: "Doğru test", en: "Right test" },
  "sonuc.test.seninEtiket": { tr: "Senin seçimin", en: "Your choice" },
  "sonuc.test.neden": {
    tr: "Doğru test orijinal kodda başarısız olur, düzeltilmiş kodda geçer. Diğer seçenekler orijinal kodda da geçer; hatayı göstermez.",
    en: "The right test fails on the original code and passes on the fixed code. The other options pass on the original too, so they don't reveal the bug.",
  },
  "sonuc.ornek.baslik": {
    tr: "Örnek mülakat cevabı",
    en: "Sample interview answer",
  },
  "sonuc.ornek.alt": {
    tr: "Bu soruyu mülakatta böyle anlatabilirsin.",
    en: "One way to explain this in an interview.",
  },
  "sonuc.kontrol.baslik": {
    tr: "Cevabını kontrol et",
    en: "Check your answer",
  },
  "sonuc.kontrol.alt": {
    tr: "Gerekçeni örnekle karşılaştır, karşıladığın maddeleri işaretle. İşaretlerin yalnız bu tarayıcıda kalır.",
    en: "Compare your reasons with the sample and tick what you covered. Your ticks stay in this browser only.",
  },
  "sonuc.koken.baslik": { tr: "Köken", en: "Origin" },
  "sonuc.koken.gercek": {
    tr: "Bu hata gerçek bir projede yakalandı. Kod oradan kopyalanmadı: aynı hata kalıbı, proje adı geçmeden sıfırdan yazıldı.",
    en: "This bug was caught in a real project. The code wasn't copied from it: the same bug pattern was written from scratch, without naming the project.",
  },
  "sonuc.koken.kurgu": {
    tr: "Bu soru bu site için yazıldı; gerçek bir vakaya dayanmaz. Kod bir yapay zekâ modelinin çıktısıdır.",
    en: "This question was written for this site and isn't based on a real case. The code is the output of an AI model.",
  },
  "sonuc.koken.baglanti": {
    tr: "Köken nasıl belirleniyor",
    en: "How origin is decided",
  },
  "sonuc.sonraki": { tr: "Sonraki soru", en: "Next question" },
  "sonuc.liste": { tr: "Tüm sorular", en: "All questions" },
  "sonuc.konuSonu": {
    tr: "Bu konudaki son soruydu.",
    en: "That was the last question in this topic.",
  },
  "sonuc.sonrakiKonu": { tr: "Sonraki konu: {konu}", en: "Next topic: {konu}" },
  "sonuc.hepsi": {
    tr: "Bütün soruları çözdün.",
    en: "You've solved every question.",
  },
  "sonuc.hepsi.dugme": { tr: "İlerlemeni gör", en: "See your progress" },
  "sorun.baglanti": { tr: "Sorun bildir", en: "Report a problem" },
  "sorun.not": {
    tr: "Kod deposunun GitHub'daki sorun sayfası yeni sekmede açılır; bildirmek için GitHub hesabı gerekir. Site GitHub'a veri göndermez.",
    en: "Opens the repository's issue page on GitHub in a new tab; you need a GitHub account to post. This site sends nothing to GitHub.",
  },
  "sorun.sablon.baslik": {
    tr: "Soru {no} ({dil}):",
    en: "Question {no} ({dil}):",
  },
  "sorun.sablon.govde.1": {
    tr: "Soru: {no} · Dil: {dil}",
    en: "Question: {no} · Language: {dil}",
  },
  "sorun.sablon.govde.2": { tr: "Ne gördün?", en: "What did you see?" },
  "sorun.sablon.govde.3": { tr: "Ne bekliyordun?", en: "What did you expect?" },
  "sorun.sablon.govde.4": {
    tr: "İlgili satır (varsa):",
    en: "Related line (if any):",
  },
  "sr.isaret.eklendi": {
    tr: "Satır {n} işaretlendi. {m}/5 işaret.",
    en: "Line {n} marked. {m} of 5 marks.",
  },
  "sr.isaret.kaldirildi": {
    tr: "Satır {n} işareti kaldırıldı. {m}/5 işaret.",
    en: "Mark removed from line {n}. {m} of 5 marks.",
  },
  "sr.satir": { tr: "Satır {n}", en: "Line {n}" },
  "sr.sonuc.bulundu": {
    tr: "Satır {n}: bulundu, {onem}",
    en: "Line {n}: found, {onem}",
  },
  "sr.sonuc.alarm": {
    tr: "Satır {n}: yanlış alarm",
    en: "Line {n}: false alarm",
  },
  "sr.sonuc.kacti": {
    tr: "Hata {i}, satır {a}–{b}: kaçtı, {onem}",
    en: "Bug {i}, lines {a}–{b}: missed, {onem}",
  },
  "sr.duzeltme.degisen": { tr: "(değişen satır)", en: "(changed line)" },
  "ilerleme.baslik": { tr: "İlerleme", en: "Progress" },
  "ilerleme.alt": {
    tr: "İlerlemen yalnız bu tarayıcıda tutulur.",
    en: "Your progress is kept in this browser only.",
  },
  "ilerleme.tablo.konu": { tr: "Konu", en: "Topic" },
  "ilerleme.tablo.cozulen": { tr: "Çözülen", en: "Solved" },
  "ilerleme.tablo.bulunan": { tr: "Bulunan hata", en: "Bugs found" },
  "ilerleme.tablo.test": { tr: "Doğru test", en: "Right test" },
  "ilerleme.tablo.deger": { tr: "{x}/{y}", en: "{x}/{y}" },
  "ilerleme.tablo.toplam": { tr: "Toplam", en: "Total" },
  "ilerleme.bos": {
    tr: "Henüz soru çözmedin.",
    en: "You haven't solved a question yet.",
  },
  "ilerleme.bos.dugme": {
    tr: "İlk soruya başla",
    en: "Start the first question",
  },
  "ilerleme.sifirla": { tr: "İlerlemeyi sıfırla", en: "Reset progress" },
  "ilerleme.onay.baslik": {
    tr: "İlerleme sıfırlansın mı?",
    en: "Reset your progress?",
  },
  "ilerleme.onay.metin": {
    tr: "Bu tarayıcıdaki bütün sonuçların, gerekçelerin ve kontrol listesi işaretlerin silinir; her soru “çözülmedi” olur. Bu işlem geri alınamaz.",
    en: "All your results, reasons and checklist ticks in this browser will be deleted, and every question will show as not solved. This can't be undone.",
  },
  "ilerleme.onay.evet": { tr: "Evet, sıfırla", en: "Yes, reset" },
  "ilerleme.onay.hayir": { tr: "Vazgeç", en: "Cancel" },
  "ilerleme.sifirlandi": { tr: "İlerleme sıfırlandı.", en: "Progress reset." },
  "ilerleme.depolama": {
    tr: "Bu tarayıcıda ilerleme kaydedilemiyor; burada gösterilecek bir şey yok. Sorular yine çalışır.",
    en: "Progress can't be saved in this browser, so there's nothing to show here. The questions still work.",
  },
  "nasil.baslik": {
    tr: "Sorular nasıl hazırlandı",
    en: "How the questions are made",
  },
  "nasil.ozet": {
    tr: "Her soru yayına girmeden iki denetimden geçer: her hata bir testle kanıtlanır ve soru, cevap anahtarını görmeden çözen ayrı bir incelemeden geçer. Soruların bir kısmı gerçek projelerde yakalanmış hatalardan gelir.",
    en: "Every question passes two checks before it goes live: each bug is proven by a test, and a separate reviewer solves the question without seeing the answer key. Some questions come from bugs caught in real projects.",
  },
  "nasil.koken.baslik": {
    tr: "Sorular nereden geliyor",
    en: "Where the questions come from",
  },
  "nasil.koken.metin1": {
    tr: "Yusuf Irmalı projelerinde kodu yapay zekâ agent'larına yazdırıyor; ayrı bir test agent'ı (QA) teslim edilen kodu bağımsız olarak deniyor. Bu aşamada yakalanan hatalar, “Gerçek proje (anonim)” etiketli soruların kaynağı.",
    en: "Yusuf Irmalı has AI agents write the code in his projects; a separate testing agent (QA) then checks the delivered code independently. Bugs caught at that stage are the source of the questions labeled “Real project (anonymized)”.",
  },
  "nasil.koken.metin2": {
    tr: "Bu sorularda kod gerçek projeden kopyalanmaz. Aynı hata kalıbı küçük bir örnekle sıfırdan yazılır; proje ve müşteri adı geçmez. Hatanın hangi bulgudan geldiği yalnız yayına girmeyen bir iç kayıtta tutulur. Hata Yusuf'un kendi ürünlerinden birinden geldiyse ürünün adı yazılabilir.",
    en: "No code in these questions is copied from the real project. The same bug pattern is rewritten from scratch as a small example, and no project or client is named. Which finding a bug came from is kept only in an internal record that isn't published. If a bug came from one of Yusuf's own products, the product may be named.",
  },
  "nasil.koken.metin3": {
    tr: "“Kurgu” etiketli sorular bu site için yazıldı; gerçek bir vakaya dayanmaz. Onlarda da kod bir yapay zekâ modelinin çıktısıdır.",
    en: "Questions labeled “Fictional” were written for this site and aren't based on a real case. Their code is also the output of an AI model.",
  },
  "nasil.koken.sayi": {
    tr: "{kunye.soru} sorudan {kunye.gercek} tanesi gerçek kökenli.",
    en: "{kunye.gercek} of the {kunye.soru} questions come from real projects.",
  },
  "nasil.kanit.baslik": {
    tr: "Her hata bir testle kanıtlanır",
    en: "Every bug is proven by a test",
  },
  "nasil.kanit.metin1": {
    tr: "Her hatanın bir kanıt testi var. Bu test orijinal kodda başarısız olur, düzeltilmiş kodda geçer. Böylece hatanın gerçekten var olduğu ve düzeltmenin onu giderdiği gösterilir.",
    en: "Every bug has a proof test. It fails on the original code and passes on the fixed code. That shows the bug is real and that the fix removes it.",
  },
  "nasil.kanit.metin2": {
    tr: "Sorudaki test seçeneklerinden yalnız biri hatayı yakalar; diğerleri orijinal kodda da geçer. Bu da testle denetlenir.",
    en: "Only one of the test options in a question catches the bug; the others pass on the original code too. This is also checked by tests.",
  },
  "nasil.kanit.metin3": {
    tr: "Kanıt testlerinin hepsi kod deposunda tek bir komutla çalıştırılabilir.",
    en: "All proof tests can be run from the repository with a single command.",
  },
  "nasil.kanit.komut": {
    tr: "Komut: {site.kanitKomut}",
    en: "Command: {site.kanitKomut}",
  },
  "nasil.kor.baslik": { tr: "Kör çözüm", en: "Blind solve" },
  "nasil.kor.metin1": {
    tr: "Her soru, cevap anahtarını görmeden çözen ayrı bir incelemeden geçer. Amaç, tanımlı hataların dışında gerçek bir hata kalmadığını görmek. İnceleme başka bir hata bulursa soru düzeltilir.",
    en: "Every question is solved by a separate reviewer who hasn't seen the answer key. The aim is to make sure no real bug is left besides the defined ones. If the reviewer finds another bug, the question is fixed.",
  },
  "nasil.kor.metin2": {
    tr: "Bu incelemeyi soruları yazan agent'lardan ayrı olan test agent'ı (QA) yapar; bütün sorular ayrıca bir kez farklı bir yapay zekâ modeline çözdürülür. Her kör çözümün tarihli kaydı tutulur.",
    en: "The testing agent (QA), separate from the agents that wrote the questions, does this review; every question is also solved once by a different AI model. Each blind solve is recorded with its date.",
  },
  "nasil.puan.baslik": {
    tr: "Sonuç nasıl hesaplanır",
    en: "How the result is worked out",
  },
  "nasil.puan.metin1": {
    tr: "Her hatanın tanımlı bir satır aralığı var. Bu aralıkta en az bir işaretin varsa hata “bulundu” sayılır. Hiçbir hatanın aralığına düşmeyen işaret “yanlış alarm” olur. Aynı işaretler her zaman aynı sonucu verir.",
    en: "Each bug has a defined line range. If at least one of your marks is inside it, the bug counts as “found”. A mark outside every bug's range is a “false alarm”. The same marks always give the same result.",
  },
  "nasil.puan.metin2": {
    tr: "Gerekçeni yapay zekâ ya da başka bir sistem puanlamaz; onu örnek mülakat cevabı ve kontrol listesiyle kendin karşılaştırırsın.",
    en: "Neither an AI nor any other system grades your reason; you compare it yourself with the sample interview answer and the checklist.",
  },
  "nasil.onem.baslik": { tr: "Önem ölçüsü", en: "Severity scale" },
  "nasil.veri.baslik": { tr: "Ne kaydediliyor", en: "What gets saved" },
  "nasil.veri.metin1": {
    tr: "Hesap yok. İlerlemen, işaretlerin, gerekçelerin ve kontrol listesi işaretlerin yalnız bu tarayıcıda tutulur; İlerleme sayfasından silebilirsin.",
    en: "There are no accounts. Your progress, marks, reasons and checklist ticks are kept only in this browser; you can delete them on the Progress page.",
  },
  "nasil.veri.sayac.acik": {
    tr: "Bir cevap gönderdiğinde sayaca yalnız şu bilgiler gider: hangi soru, arayüz dili, kaç hata bulunduğu ve soruda kaç hata olduğu, kaç yanlış alarm verildiği, gerekçe yazılıp yazılmadığı (metni değil) ve test seçiminin doğru olup olmadığı. Sayaç kimlik, çerez ya da IP adresi kaydetmez; gerekçe metni cihazından çıkmaz.",
    en: "When you submit an answer, only this goes to the counter: which question, the interface language, how many bugs were found and how many the question has, how many false alarms, whether a reason was written (not the text), and whether the test choice was right. The counter doesn't record identity, cookies or IP addresses; your reason text never leaves your device.",
  },
  "nasil.lisans.baslik": {
    tr: "Lisans ve kaynak kodu",
    en: "License and source code",
  },
  "nasil.lisans.metin": {
    tr: "Sitenin kodu ve soruların hepsi MIT lisansıyla açık. Kaynak kodu, kanıt testleri ve soru dosyaları kod deposunda.",
    en: "The site's code and all of the questions are open under the MIT license. The source code, proof tests and question files are in the repository.",
  },
  "nasil.katki.metin": {
    tr: "Yeni bir soru eklemek için uygulama koduna dokunman gerekmez: soru dosyasının biçimi README'de bir örnekle anlatılıyor. Eklenen sorular da aynı iki denetimden geçmeden yayına girmez.",
    en: "Adding a question doesn't require touching the app code: the README shows the question file format with an example. New questions also go live only after passing the same two checks.",
  },
  "nasil.sorun.metin": {
    tr: "Yanlış ya da tartışmalı bulduğun bir soruyu her sonuç ekranındaki “Sorun bildir” bağlantısıyla bildirebilirsin.",
    en: "If you think a question is wrong or debatable, use the “Report a problem” link on any result screen.",
  },
  "nasil.dugme.depo": { tr: "Kod deposunu aç", en: "Open the repository" },
  "nasil.dugme.lisans": { tr: "Lisansı oku", en: "Read the license" },
  "nasil.lisans.yazitipi": {
    tr: "Yazı tipleri: Source Serif 4, IBM Plex Sans ve IBM Plex Mono (SIL Open Font License 1.1).",
    en: "Typefaces: Source Serif 4, IBM Plex Sans and IBM Plex Mono (SIL Open Font License 1.1).",
  },
  "nasil.sinir.baslik": {
    tr: "Bu sürümde olmayanlar",
    en: "Not in this version",
  },
  "nasil.sinir.metin": {
    tr: "Her kodda en az bir hata var; hatasız kod sorusu yok. Kodlar TypeScript, JavaScript ve Python'da. Süre sınırı, sıralama ya da rozet yok.",
    en: "Every snippet has at least one bug; there are no bug-free questions. The code is in TypeScript, JavaScript and Python. There's no timer, ranking or badge.",
  },
  "nasil.yapan.baslik": { tr: "Hazırlayan", en: "Made by" },
  "nasil.yapan.metin": {
    tr: "Yusuf Irmalı · GitHub",
    en: "Yusuf Irmalı · GitHub",
  },
  "bulunamadi.baslik": { tr: "Bu sayfa yok", en: "This page doesn't exist" },
  "bulunamadi.metin": {
    tr: "Adres yanlış ya da sayfa taşınmış olabilir.",
    en: "The address may be wrong, or the page may have moved.",
  },
  "bulunamadi.soru": {
    tr: "Soru {no} bulunamadı. Soru listesinden seçebilirsin.",
    en: "Question {no} wasn't found. You can pick one from the list.",
  },
  "bulunamadi.dugme": { tr: "Sorulara dön", en: "Back to questions" },
  "nasil.kor.metin2.yedek": {
    tr: "Bu incelemeyi soruları yazan agent'lardan ayrı olan test agent'ı (QA) yapar. Her kör çözümün tarihli kaydı tutulur.",
    en: "The testing agent (QA), separate from the agents that wrote the questions, does this review. Each blind solve is recorded with its date.",
  },
  "ortak.alt.veri": { tr: "Veriler", en: "Data" },
  "sekme.veri": { tr: "Veriler · {urun.ad}", en: "Data · {urun.ad}" },
  "veri.baslik": { tr: "Veriler", en: "Data" },
  "veri.ozet": {
    tr: "Bu sayfa, sitenin cihazında neyi tuttuğunu ve bir cevap gönderdiğinde sunucuya neyin gidip neyin gitmediğini anlatır. Kısaca: hesap ve çerez yok, ilerlemen bu tarayıcıda kalır, her gönderimde sayaca yedi bilgi gider; hiçbiri kim olduğunu göstermez.",
    en: "This page explains what the site keeps on your device and what is and isn't sent to the server when you submit an answer. In short: there are no accounts or cookies, your progress stays in this browser, and each submission sends seven pieces of information to a counter; none of them says who you are.",
  },
  "veri.kim.baslik": { tr: "Siteyi kim yayımlıyor", en: "Who runs this site" },
  "veri.kim.metin": {
    tr: "{urun.ad} sitesini {site.sahibi} hazırlıyor ve yayımlıyor. Site ücretsizdir.",
    en: "{urun.ad} is made and run by {site.sahibi}. The site is free.",
  },
  "veri.kim.iletisim": {
    tr: "İletişim: {iletisim.eposta}",
    en: "Contact: {iletisim.eposta}",
  },
  "veri.yok.baslik": {
    tr: "Sitede olmayanlar",
    en: "What the site doesn't have",
  },
  "veri.yok.metin": {
    tr: "Hesap, giriş, çerez ve reklam yok. Üçüncü taraf analitik ya da takip betiği yok; sayfa açılırken başka bir siteden dosya yüklenmez, yazı tipleri de sitenin kendi sunucusundan gelir. Veriler satılmaz, kimse hakkında profil çıkarılmaz.",
    en: "There are no accounts, sign-ins, cookies or ads. There are no third-party analytics or tracking scripts; nothing is loaded from another site when a page opens, and the fonts come from the site's own server too. No data is sold, and no profile is built about anyone.",
  },
  "veri.yok.github": {
    tr: "“Kaynak kodu” ve “Sorun bildir” bağlantıları ile hazırlayanın adı GitHub'a gider; orada GitHub'ın kendi kuralları geçerlidir.",
    en: "The “Source code” and “Report a problem” links and the author's name lead to GitHub, where GitHub's own terms apply.",
  },
  "veri.cihaz.baslik": {
    tr: "Cihazında kalanlar",
    en: "What stays on your device",
  },
  "veri.cihaz.metin1": {
    tr: "Hesap olmadığı için ilerlemen sunucuda değil, bu tarayıcının yerel depolamasında (localStorage) tutulur. İki kayıt var: ilerleme (her soru için son gönderdiğin cevap: işaretlediğin satırlar, seçtiğin önemler, gerekçe metinlerin, test seçimin ve kontrol listesi işaretlerin) ve dil. Bu kayıtlar sunucuya gönderilmez.",
    en: "Since there are no accounts, your progress is kept in this browser's local storage (localStorage), not on a server. There are two records: progress (for each question, the last answer you submitted: the lines you marked, the severities, your reason texts, your test choice and your checklist ticks) and language. These records are never sent to the server.",
  },
  "veri.cihaz.metin2": {
    tr: "İlerleme kaydı ilk cevabını gönderdiğinde oluşur; sonra her gönderimde, kontrol listesinde bir maddeyi işaretlediğinde ve ilerlemeyi sıfırladığında güncellenir. Dil kaydı açtığın sayfanın dilini tutar; site bir dahaki gelişinde aynı dilde açılır. Göndermediğin işaretler kaydedilmez.",
    en: "The progress record is created when you submit your first answer, then updated on each submission, when you tick a checklist item and when you reset your progress. The language record keeps the language of the page you open, so the site opens in that language next time. Marks you haven't submitted aren't saved.",
  },
  "veri.cihaz.sil": {
    tr: "Silmek için İlerleme sayfasındaki “İlerlemeyi sıfırla” düğmesini kullan: cevapların, gerekçelerin ve kontrol listesi işaretlerin silinir. Dil kaydı dahil her şeyi silmek için tarayıcının bu siteye ait verilerini temizle.",
    en: "To delete them, use “Reset progress” on the Progress page: your answers, reasons and checklist ticks are deleted. To delete everything, including the language record, clear this site's data in your browser.",
  },
  "veri.cihaz.dil": {
    tr: "Ana adresi açtığında bu tarayıcıda dil kaydı yoksa, başlangıç dilini seçmek için tarayıcının dil ayarına bakılır: Türkçe ise site Türkçe, değilse İngilizce açılır. Bu ayar kaydedilmez ve sayaca gönderilmez; sayaca giden dil, o an kullandığın arayüz dilidir.",
    en: "When you open the home address and this browser has no language record, the browser's language setting is checked to pick the starting language: Turkish if it's Turkish, English otherwise. That setting isn't saved or sent to the counter; the language sent to the counter is the interface language you're using.",
  },
  "veri.sayac.baslik": {
    tr: "Cevap gönderdiğinde ne gider",
    en: "What is sent when you submit",
  },
  "veri.sayac.metin": {
    tr: "Bir cevabı gönderdiğinde site, kendi sunucusundaki kullanım sayacına tek bir istek yollar. Sayfa açarken, satır işaretlerken ya da gezinirken sayaç çalışmaz. İstekte yalnız şu yedi bilgi var:",
    en: "When you submit an answer, the site sends a single request to the usage counter on its own server. The counter doesn't run while you open pages, mark lines or browse. The request holds only these seven pieces of information:",
  },
  "veri.sayac.alan.1": {
    tr: "Hangi soru (adresindeki kısa adı)",
    en: "Which question (the short name in its address)",
  },
  "veri.sayac.alan.2": {
    tr: "Arayüz dili: Türkçe ya da İngilizce",
    en: "Interface language: Turkish or English",
  },
  "veri.sayac.alan.3": {
    tr: "Kaç hata bulduğun",
    en: "How many bugs you found",
  },
  "veri.sayac.alan.4": {
    tr: "Soruda kaç hata olduğu: bir ya da iki",
    en: "How many bugs the question has: one or two",
  },
  "veri.sayac.alan.5": {
    tr: "İşaretlerinden kaçının yanlış alarm olduğu",
    en: "How many of your marks were false alarms",
  },
  "veri.sayac.alan.6": {
    tr: "Hatayı bulan bir işarete gerekçe yazıp yazmadığın: evet ya da hayır, metin değil",
    en: "Whether a mark that found a bug has a reason: yes or no, not the text",
  },
  "veri.sayac.alan.7": {
    tr: "Test seçiminin doğru olup olmadığı: evet ya da hayır",
    en: "Whether your test choice was right: yes or no",
  },
  "veri.sayac.yok": {
    tr: "İstekte işaretlediğin satırlar, gerekçe metni, kontrol listesi, çerez ve geldiğin sayfanın adresi (referrer) yok; kim olduğunu gösteren bir kimlik ya da numara da yok. Sayacın sunucu kodu IP adresini, tarayıcı ve cihaz bilgisini, çerezleri ve geldiğin sayfayı okumaz; kod deposundaki otomatik bir test bunu denetler.",
    en: "The request doesn't include the lines you marked, your reason text, the checklist, cookies or the page you came from (referrer), and there's no ID or number that says who you are. The counter's server code doesn't read your IP address, browser or device details, cookies or the page you came from; an automated test in the repository checks this.",
  },
  "veri.sayac.kapatma": {
    tr: "Sayaç her gönderimde çalışır; sitede kapatma seçeneği yok. Yalnız yukarıdaki yedi bilgiyi gönderir. Tarayıcın ya da bir eklenti bu isteği engellerse site aynı şekilde çalışır.",
    en: "The counter runs on every submission; the site has no option to turn it off. It sends only the seven pieces of information above. If your browser or an extension blocks the request, the site works the same.",
  },
  "veri.saklama.baslik": {
    tr: "Sayılar nasıl saklanır",
    en: "How the counts are kept",
  },
  "veri.saklama.metin1": {
    tr: "Gönderimler tek tek kaydedilmez. Sunucu yalnız gün başına toplamları tutar: o gün aynı yedi bilgiyle kaç gönderim geldiği. Saat ve sıra tutulmaz.",
    en: "Submissions aren't stored one by one. The server keeps only totals per day: how many submissions arrived that day with the same seven pieces of information. No time or order is kept.",
  },
  "veri.saklama.metin2": {
    tr: "Toplamlar Cloudflare'in veritabanında (D1) durur; onları yalnız {site.sahibi} gizli bir anahtarla görebilir. {veri.saklamaAy} aydan eski günlerin toplamları bir sonraki gönderimde ya da toplamlar okunurken silinir; o zamana kadar veritabanında kalsalar da hiç gösterilmezler. Silinenler bir süre Cloudflare'in yedeğinde kalabilir.",
    en: "The totals are stored in Cloudflare's database (D1); only {site.sahibi} can see them, with a secret key. Totals older than {veri.saklamaAy} months are deleted at the next submission or when the totals are read; until then they stay in the database but are never shown. Deleted totals may remain in Cloudflare's backup for a while.",
  },
  "veri.amac": {
    tr: "Toplamlar soruları ve siteyi düzeltmek için kullanılır: hatalı ya da gereğinden zor soruları bulmak, gerekçe adımının yapılıp yapılmadığını ve hangi dilin kullanıldığını görmek. Reklam ya da pazarlama için kullanılmaz.",
    en: "The totals are used to fix the questions and the site: to find questions that are wrong or harder than they should be, and to see whether people write reasons and which language they use. They aren't used for ads or marketing.",
  },
  "veri.paylasim": {
    tr: "Toplamlar satılmaz ve başkalarına verilmez. Kaç cevap gönderildiği gibi genel sayılar, sitenin nasıl yapıldığını anlatan bir yazıda yayımlanabilir; o zaman birini ayırt ettirebilecek küçük sayılar gizlenir ya da birleştirilir.",
    en: "The totals aren't sold or given to anyone. General figures, such as how many answers were submitted, may be published in a write-up about how the site was built; small numbers that could single someone out are then hidden or combined.",
  },
  "veri.barindirma.baslik": {
    tr: "Barındırma: Cloudflare",
    en: "Hosting: Cloudflare",
  },
  "veri.barindirma.metin1": {
    tr: "Site ve sayaç Cloudflare üzerinde çalışır. Bir sayfayı açtığında tarayıcın Cloudflare'in sunucularına bağlanır; Cloudflare bu sırada IP adresini teknik olarak işler ve kendi politikasına göre kayıt tutabilir. Bu, sayaçtan bağımsızdır: sayaç olmasa da her ziyarette olur.",
    en: "The site and the counter run on Cloudflare. When you open a page, your browser connects to Cloudflare's servers; in doing so, Cloudflare technically processes your IP address and may keep records under its own policy. This is separate from the counter: it happens on every visit, counter or not.",
  },
  "veri.barindirma.metin2": {
    tr: "Cloudflare'in sunucuları Türkiye dışında olabilir. Ayrıntılar Cloudflare'in gizlilik politikasında (İngilizce).",
    en: "Cloudflare's servers may be outside Türkiye. Details are in Cloudflare's privacy policy.",
  },
  "veri.barindirma.baglanti": {
    tr: "Cloudflare gizlilik politikası",
    en: "Cloudflare privacy policy",
  },
  "veri.hukuk.baslik": {
    tr: "Kişisel veriler ve iletişim",
    en: "Personal data and contact",
  },
  "veri.hukuk.metin": {
    tr: "Kişisel verilerinle ilgili soruların için {iletisim.eposta} adresine yazabilirsin.",
    en: "If you have questions about your personal data, write to {iletisim.eposta}.",
  },
  "veri.surum": {
    tr: "Son güncelleme: {veri.tarih}. Sayaç ya da barındırma değişirse bu sayfa da güncellenir.",
    en: "Last updated: {veri.tarih}. If the counter or the hosting changes, this page is updated too.",
  },
  "nasil.veri.baglanti": {
    tr: "Ayrıntılar Veriler sayfasında",
    en: "Details are on the Data page",
  },
  "gonder.veri.not": {
    tr: "Gönderince sayaca yedi bilgi gider; gerekçe metnin cihazında kalır.",
    en: "Submitting sends seven pieces of information to a counter; your reason text stays on your device.",
  },
} as const satisfies Record<string, { tr: string; en: string }>;

export type MessageKey = keyof typeof messages;
