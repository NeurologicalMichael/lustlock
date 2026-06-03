#if os(iOS)
import Foundation
import FamilyControls
import ManagedSettings
import SwiftUI

@available(iOS 16.0, *)
class ScreenTimeManager: NSObject {
  static let shared = ScreenTimeManager()
  private let store = ManagedSettingsStore()
  private let defaults = UserDefaults.standard

  // MARK: - Auth

  var authorizationStatus: String {
    switch AuthorizationCenter.shared.authorizationStatus {
    case .approved:       return "approved"
    case .denied:         return "denied"
    case .notDetermined:  return "notDetermined"
    @unknown default:     return "unknown"
    }
  }

  func requestAuthorization(completion: @escaping (String, String?) -> Void) {
    Task { @MainActor in
      do {
        try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
        completion("approved", nil)
      } catch {
        completion("denied", error.localizedDescription)
      }
    }
  }

  // MARK: - Web content (blocks all websites in managed browsers)

  var adultContentBlocked: Bool { defaults.bool(forKey: "ll_adult_blocked") }

  func setAdultContentBlocked(_ blocked: Bool) {
    // .all(except:[]) is the ManagedSettings API for "block all web content"
    store.webContent.blockedByFilter = blocked ? .all(except: []) : nil
    defaults.set(blocked, forKey: "ll_adult_blocked")
  }

  // MARK: - App shielding via FamilyActivityPicker

  var appShieldEnabled: Bool    { defaults.bool(forKey: "ll_apps_shielded") }
  var shieldedAppCount: Int     { defaults.integer(forKey: "ll_app_count") }
  var shieldedCategoryCount: Int { defaults.integer(forKey: "ll_cat_count") }

  private var savedSelection: FamilyActivitySelection? {
    get {
      guard let data = defaults.data(forKey: "ll_selection"),
            let sel  = try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
      else { return nil }
      return sel
    }
    set {
      if let sel = newValue, let data = try? PropertyListEncoder().encode(sel) {
        defaults.set(data, forKey: "ll_selection")
      } else {
        defaults.removeObject(forKey: "ll_selection")
      }
    }
  }

  func presentAppPicker(completion: @escaping ([String: Any]) -> Void) {
    DispatchQueue.main.async {
      guard let topVC = self.topViewController() else {
        completion(["success": false, "error": "No root view controller"])
        return
      }
      let current = self.savedSelection ?? FamilyActivitySelection()
      let sheet = UIHostingController(
        rootView: FamilyActivityPickerSheet(
          selection: current,
          onDone: { [weak self] newSel in
            topVC.dismiss(animated: true)
            self?.savedSelection = newSel
            self?.applyShield(newSel)
            completion([
              "success": true,
              "appCount": newSel.applicationTokens.count,
              "categoryCount": newSel.categoryTokens.count,
            ])
          },
          onCancel: {
            topVC.dismiss(animated: true)
            completion(["success": false])
          }
        )
      )
      sheet.modalPresentationStyle = .formSheet
      topVC.present(sheet, animated: true)
    }
  }

  func applyShield(_ selection: FamilyActivitySelection) {
    store.shield.applications = selection.applicationTokens
    store.shield.applicationCategories = .specific(selection.categoryTokens)
    let active = !selection.applicationTokens.isEmpty || !selection.categoryTokens.isEmpty
    defaults.set(active,                             forKey: "ll_apps_shielded")
    defaults.set(selection.applicationTokens.count,  forKey: "ll_app_count")
    defaults.set(selection.categoryTokens.count,     forKey: "ll_cat_count")
  }

  func clearAppShield() {
    store.shield.applications = []
    store.shield.applicationCategories = .none
    savedSelection = nil
    defaults.set(false, forKey: "ll_apps_shielded")
    defaults.set(0,     forKey: "ll_app_count")
    defaults.set(0,     forKey: "ll_cat_count")
  }

  func clearAll() {
    setAdultContentBlocked(false)
    clearAppShield()
  }

  // Re-applies persisted restrictions after cold start (call once authorized).
  func restoreIfNeeded() {
    guard authorizationStatus == "approved" else { return }
    if adultContentBlocked { setAdultContentBlocked(true) }
    if let sel = savedSelection { applyShield(sel) }
  }

  func getState() -> [String: Any] {
    [
      "authStatus":            authorizationStatus,
      "adultContentBlocked":   adultContentBlocked,
      "appShieldEnabled":      appShieldEnabled,
      "shieldedAppCount":      shieldedAppCount,
      "shieldedCategoryCount": shieldedCategoryCount,
    ]
  }

  private func topViewController() -> UIViewController? {
    let scene = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .first(where: { $0.activationState == .foregroundActive })
    var top = scene?.windows.first(where: { $0.isKeyWindow })?.rootViewController
    while let presented = top?.presentedViewController { top = presented }
    return top
  }
}

// MARK: - SwiftUI FamilyActivityPicker sheet

@available(iOS 16.0, *)
struct FamilyActivityPickerSheet: View {
  @State var selection: FamilyActivitySelection
  let onDone:   (FamilyActivitySelection) -> Void
  let onCancel: () -> Void

  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Shield These Apps")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .navigationBarLeading) {
            Button("Cancel", action: onCancel)
          }
          ToolbarItem(placement: .navigationBarTrailing) {
            Button("Done") { onDone(selection) }
              .fontWeight(.semibold)
          }
        }
    }
  }
}
#endif
