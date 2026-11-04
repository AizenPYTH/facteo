import AppIntents
import Foundation

/// « Dis Siri, facture INVEQ » : Siri demande ce qu'il faut facturer, puis
/// INVEQ s'ouvre sur une nouvelle facture déjà remplie par l'IA.
///
/// Le texte dicté est rangé dans les préférences de l'app (UserDefaults) sous
/// `inveqSiriDictation` ; le JavaScript le lit avec `Settings` de React Native
/// (src/hooks/use-siri-dictation.ts), que l'app soit déjà ouverte ou non.
@available(iOS 16.0, *)
struct CreateInvoiceIntent: AppIntent {
  static var title: LocalizedStringResource = "Créer une facture"
  static var description = IntentDescription(
    "Dictez votre facture : client, produits, prix et TVA. INVEQ la prépare pour vous."
  )
  static var openAppWhenRun: Bool = true

  @Parameter(
    title: "Facture",
    requestValueDialog: IntentDialog("Que dois-je facturer, et à qui ?")
  )
  var dictation: String

  @MainActor
  func perform() async throws -> some IntentResult {
    let text = dictation.trimmingCharacters(in: .whitespacesAndNewlines)
    if !text.isEmpty {
      let payload: [String: Any] = ["text": String(text.prefix(4000)), "at": Date().timeIntervalSince1970]
      if let data = try? JSONSerialization.data(withJSONObject: payload),
        let json = String(data: data, encoding: .utf8)
      {
        UserDefaults.standard.set(json, forKey: "inveqSiriDictation")
      }
    }
    return .result()
  }
}

@available(iOS 16.0, *)
struct InveqShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: CreateInvoiceIntent(),
      phrases: [
        "Facture \(.applicationName)",
        "Facture avec \(.applicationName)",
        "Nouvelle facture \(.applicationName)",
        "Crée une facture avec \(.applicationName)",
        "Fais une facture avec \(.applicationName)",
        "Créer une facture \(.applicationName)",
      ]
    )
  }
}
