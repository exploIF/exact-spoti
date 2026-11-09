// The iPhone player bar: on iOS 26 and later, a real tab bar accessory, which UIKit
// merges into the tab bar as the content scrolls (as Apple Music's does). Everywhere
// else, and under the test driver, `active` is false and app.contract draws its own bar.
// The accessory's buttons click hidden authored buttons, so they run the same actions.
import Foundation
#if os(iOS)
import UIKit
#endif

final class PlayerBar: ExactModule {
    #if os(iOS)
    private weak var controller: UITabBarController?
    private var controls: [String: ExactElement] = [:]
    private var view: AnyObject?
    private var track: [String: Any] = [:]

    private var usable: Bool {
        guard #available(iOS 26.0, *) else { return false }
        return !context.agent && UIDevice.current.userInterfaceIdiom == .phone
    }

    override func tabs(_ tabs: ExactTabs) {
        guard usable, #available(iOS 26.0, *) else { return }
        controller = tabs.controller
        tabs.controller.tabBarMinimizeBehavior = .onScrollDown
        apply()
    }

    override func element(_ element: ExactElement) {
        if !element.id.isEmpty { controls[element.id] = element }
    }

    override func elementEnded(_ element: ExactElement) {
        if controls[element.id] === element { controls.removeValue(forKey: element.id) }
    }

    override func call(_ request: [String: Any]) throws -> [String: Any] {
        let active = usable
        if active {
            DispatchQueue.main.async { [weak self] in
                self?.track = request
                self?.apply()
            }
        }
        return ["active": active]
    }

    private func apply() {
        guard #available(iOS 26.0, *), let controller else { return }
        guard track["hasTrack"] as? Bool == true else {
            if controller.bottomAccessory != nil { controller.setBottomAccessory(nil, animated: true) }
            view = nil
            return
        }
        let bar: PlayerBarView
        if let shown = view as? PlayerBarView {
            bar = shown
        } else {
            bar = PlayerBarView { [weak self] id in self?.controls[id]?.click() }
            view = bar
            controller.setBottomAccessory(UITabAccessory(contentView: bar), animated: true)
        }
        bar.show(
            title: track["title"] as? String ?? "",
            artist: track["artist"] as? String ?? "",
            cover: track["cover"] as? String ?? "",
            playing: track["isPlaying"] as? Bool == true)
    }
    #else
    override func call(_ request: [String: Any]) throws -> [String: Any] { ["active": false] }
    #endif
}

#if os(iOS)
/// What the accessory shows. UIKit tells it through a trait whether it is the full bar
/// above the tabs or the compact one merged beside the minimized tab bar.
@available(iOS 26.0, *)
final class PlayerBarView: UIView {
    private let press: (String) -> Void
    private let art = UIImageView()
    private let title = UILabel()
    private let artist = UILabel()
    private let text = UIStackView()
    private let toggle = UIButton(type: .system)
    private let skip = UIButton(type: .system)
    private var cover = ""

    init(press: @escaping (String) -> Void) {
        self.press = press
        super.init(frame: .zero)
        overrideUserInterfaceStyle = .dark
        isAccessibilityElement = false

        art.contentMode = .scaleAspectFill
        art.clipsToBounds = true
        art.layer.cornerRadius = 15
        art.widthAnchor.constraint(equalToConstant: 30).isActive = true
        art.heightAnchor.constraint(equalToConstant: 30).isActive = true

        title.font = .systemFont(ofSize: 14, weight: .semibold)
        artist.font = .systemFont(ofSize: 12)
        artist.textColor = .secondaryLabel
        text.axis = .vertical
        text.addArrangedSubview(title)
        text.addArrangedSubview(artist)
        text.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)

        configure(toggle, label: "Pause", id: "bar-toggle")
        configure(skip, label: "Next song", id: "bar-next")
        skip.setImage(UIImage(systemName: "forward.end.fill"), for: .normal)

        let row = UIStackView(arrangedSubviews: [art, text, toggle, skip])
        row.axis = .horizontal
        row.alignment = .center
        row.spacing = 8
        row.translatesAutoresizingMaskIntoConstraints = false
        addSubview(row)
        NSLayoutConstraint.activate([
            row.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 12),
            row.trailingAnchor.constraint(equalTo: trailingAnchor, constant: -8),
            row.centerYAnchor.constraint(equalTo: centerYAnchor),
        ])

        let tap = UITapGestureRecognizer(target: self, action: #selector(open))
        addGestureRecognizer(tap)
        accessibilityTraits = .button
        registerForTraitChanges([UITraitTabAccessoryEnvironment.self]) { (self: PlayerBarView, _: UITraitCollection) in
            self.fit()
        }
        fit()
    }

    required init?(coder: NSCoder) { nil }

    private func configure(_ button: UIButton, label: String, id: String) {
        button.tintColor = .label
        button.accessibilityLabel = label
        button.accessibilityIdentifier = id
        button.widthAnchor.constraint(equalToConstant: 40).isActive = true
        button.heightAnchor.constraint(equalToConstant: 40).isActive = true
        button.addAction(UIAction { [weak self] _ in self?.press(id) }, for: .touchUpInside)
    }

    @objc private func open() { press("bar-open") }

    /// The merged bar is narrow: it keeps the cover, the title and play or pause.
    private func fit() {
        let merged = traitCollection.tabAccessoryEnvironment == .inline
        artist.isHidden = merged
        skip.isHidden = merged
    }

    func show(title newTitle: String, artist newArtist: String, cover newCover: String, playing: Bool) {
        title.text = newTitle
        artist.text = newArtist
        toggle.setImage(UIImage(systemName: playing ? "pause.fill" : "play.fill"), for: .normal)
        toggle.accessibilityLabel = playing ? "Pause" : "Play"
        accessibilityLabel = "Now playing: \(newTitle)"
        if newCover != cover {
            cover = newCover
            art.image = UIImage(contentsOfFile: Bundle.main.bundleURL.appendingPathComponent(newCover).path)
        }
    }
}
#endif

let exactModule: ExactModule.Type = PlayerBar.self
