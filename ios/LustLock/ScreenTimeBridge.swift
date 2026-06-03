#if os(iOS)
import Foundation

@objc(ScreenTimeBridge)
class ScreenTimeBridge: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { true }

  @objc func getState(
    _ resolve: @escaping (Any?) -> Void,
    rejecter reject: @escaping (String?, String?, Error?) -> Void
  ) {
    if #available(iOS 16.0, *) {
      resolve(ScreenTimeManager.shared.getState())
    } else {
      resolve(["authStatus": "unsupported"] as [String: Any])
    }
  }

  @objc func requestAuthorization(
    _ resolve: @escaping (Any?) -> Void,
    rejecter reject: @escaping (String?, String?, Error?) -> Void
  ) {
    if #available(iOS 16.0, *) {
      ScreenTimeManager.shared.requestAuthorization { status, errorMsg in
        if let msg = errorMsg, status == "denied" {
          reject("AUTH_DENIED", msg, nil)
        } else {
          resolve(status)
        }
      }
    } else {
      reject("UNSUPPORTED", "Screen Time API requires iOS 16+", nil)
    }
  }

  @objc func setAdultContentBlocked(
    _ blocked: Bool,
    resolver resolve: @escaping (Any?) -> Void,
    rejecter reject: @escaping (String?, String?, Error?) -> Void
  ) {
    if #available(iOS 16.0, *) {
      ScreenTimeManager.shared.setAdultContentBlocked(blocked)
      resolve(true)
    } else {
      reject("UNSUPPORTED", "Screen Time API requires iOS 16+", nil)
    }
  }

  @objc func presentAppPicker(
    _ resolve: @escaping (Any?) -> Void,
    rejecter reject: @escaping (String?, String?, Error?) -> Void
  ) {
    if #available(iOS 16.0, *) {
      ScreenTimeManager.shared.presentAppPicker { result in
        resolve(result)
      }
    } else {
      reject("UNSUPPORTED", "Screen Time API requires iOS 16+", nil)
    }
  }

  @objc func clearAppShield(
    _ resolve: @escaping (Any?) -> Void,
    rejecter reject: @escaping (String?, String?, Error?) -> Void
  ) {
    if #available(iOS 16.0, *) {
      ScreenTimeManager.shared.clearAppShield()
      resolve(true)
    } else {
      reject("UNSUPPORTED", "Screen Time API requires iOS 16+", nil)
    }
  }

  @objc func clearAll(
    _ resolve: @escaping (Any?) -> Void,
    rejecter reject: @escaping (String?, String?, Error?) -> Void
  ) {
    if #available(iOS 16.0, *) {
      ScreenTimeManager.shared.clearAll()
      resolve(true)
    } else {
      reject("UNSUPPORTED", "Screen Time API requires iOS 16+", nil)
    }
  }

  @objc func restoreRestrictions(
    _ resolve: @escaping (Any?) -> Void,
    rejecter reject: @escaping (String?, String?, Error?) -> Void
  ) {
    if #available(iOS 16.0, *) {
      ScreenTimeManager.shared.restoreIfNeeded()
      resolve(true)
    } else {
      resolve(false)
    }
  }
}
#endif
