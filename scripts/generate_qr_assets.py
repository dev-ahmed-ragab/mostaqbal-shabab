"""
Script to generate ultra-high-resolution QR code assets and printable PDFs for:
حزب مستقبل وطن - أمانة مركز بركة السبع (أمانة الشباب)
URL: https://mostaqbal-shabab.vercel.app/
"""

import os
import sys
import base64
import qrcode
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import cv2
import numpy as np
import arabic_reshaper
from bidi.algorithm import get_display

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_DIR = os.path.join(BASE_DIR, 'public')
os.makedirs(PUBLIC_DIR, exist_ok=True)

# Helper for Arabic text rendering
def ar(text: str) -> str:
    if not text:
        return ""
    configuration = {
        'delete_harakat': False,
        'support_ligatures': True,
        'OBLIGATORY_LIGATURES': True,
    }
    reshaper = arabic_reshaper.ArabicReshaper(configuration=configuration)
    reshaped_text = reshaper.reshape(text)
    return get_display(reshaped_text)

# Color Palette (Party Official Brand Colors)
NAVY = (19, 48, 99, 255)            # #133063 Deep Royal Navy
CYAN = (2, 132, 199, 255)           # #0284c7 Sky Blue
LIGHT_BLUE = (240, 249, 255, 255)  # #f0f9ff Soft ice blue
GOLD = (217, 119, 6, 255)           # #d97706 Warm Amber Gold
DARK_GRAY = (51, 65, 85, 255)        # #334155 Slate
MUTED_GRAY = (100, 116, 139, 255)   # #64748b
BORDER_GRAY = (226, 232, 240, 255)  # #e2e8f0
CARD_BG = (248, 250, 252, 255)      # #f8fafc
WHITE = (255, 255, 255, 255)
EGYPT_RED = (206, 17, 38, 255)
EGYPT_BLACK = (20, 20, 20, 255)

# Fonts
FONT_BOLD = r'C:\Windows\Fonts\segoeuib.ttf'
FONT_REGULAR = r'C:\Windows\Fonts\segoeui.ttf'
if not os.path.exists(FONT_BOLD):
    FONT_BOLD = r'C:\Windows\Fonts\arialbd.ttf'
    FONT_REGULAR = r'C:\Windows\Fonts\arial.ttf'

def get_font(size: int, bold: bool = True):
    path = FONT_BOLD if bold else FONT_REGULAR
    return ImageFont.truetype(path, size)

def generate_styled_qr(url: str, output_size: int = 2000, logo_path: str = None) -> Image.Image:
    """
    Generates a high-resolution styled QR code with:
    - Party Navy modules with subtle rounding
    - Styled 3 finder pattern eyes (Navy outer ring + Sky Blue pupil)
    - Center badge containing the party logo
    """
    if logo_path is None:
        logo_path = os.path.join(PUBLIC_DIR, 'logo.png')

    qr = qrcode.QRCode(
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4
    )
    qr.add_data(url)
    qr.make(fit=True)
    matrix = qr.get_matrix()
    matrix_size = len(matrix)
    border = 4

    module_size = output_size // matrix_size
    img_size = module_size * matrix_size

    qr_img = Image.new('RGBA', (img_size, img_size), WHITE)
    draw = ImageDraw.Draw(qr_img)

    def in_finder(r, c):
        if r < border + 7 and c < border + 7: return True
        if r < border + 7 and c >= matrix_size - border - 7: return True
        if r >= matrix_size - border - 7 and c < border + 7: return True
        return False

    # Draw data modules
    corner_radius = max(2, module_size // 4)
    for r in range(matrix_size):
        for c in range(matrix_size):
            if matrix[r][c] and not in_finder(r, c):
                x1 = c * module_size
                y1 = r * module_size
                x2 = x1 + module_size
                y2 = y1 + module_size
                draw.rounded_rectangle((x1 + 1, y1 + 1, x2 - 1, y2 - 1), radius=corner_radius, fill=NAVY)

    # Draw 3 Finder Patterns (eyes)
    def draw_eye(top_row, left_col):
        x = left_col * module_size
        y = top_row * module_size
        outer_r = max(4, module_size * 2 // 3)
        # 7x7 outer square
        draw.rounded_rectangle((x, y, x + 7 * module_size, y + 7 * module_size), radius=outer_r * 2, fill=NAVY)
        # 5x5 inner white
        draw.rounded_rectangle((x + module_size, y + module_size, x + 6 * module_size, y + 6 * module_size), radius=outer_r + 2, fill=WHITE)
        # 3x3 vibrant center pupil
        draw.rounded_rectangle((x + 2 * module_size, y + 2 * module_size, x + 5 * module_size, y + 5 * module_size), radius=outer_r, fill=CYAN)

    draw_eye(border, border)
    draw_eye(border, matrix_size - border - 7)
    draw_eye(matrix_size - border - 7, border)

    # Center Badge for Logo (24% of QR size)
    badge_dim = int(img_size * 0.24)
    badge = Image.new('RGBA', (badge_dim, badge_dim), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(badge)
    badge_radius = int(badge_dim * 0.22)

    # Draw white badge with party double border
    bdraw.rounded_rectangle((2, 2, badge_dim - 2, badge_dim - 2), radius=badge_radius, fill=WHITE, outline=NAVY, width=max(4, badge_dim // 35))
    bdraw.rounded_rectangle((9, 9, badge_dim - 9, badge_dim - 9), radius=badge_radius - 5, fill=WHITE, outline=CYAN, width=max(2, badge_dim // 70))

    # Paste Party Logo inside badge
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert('RGBA')
        lw, lh = logo.size
        scale = (badge_dim * 0.76) / max(lw, lh)
        new_w, new_h = int(lw * scale), int(lh * scale)
        logo_resized = logo.resize((new_w, new_h), Image.Resampling.LANCZOS)
        badge.paste(logo_resized, ((badge_dim - new_w) // 2, (badge_dim - new_h) // 2), logo_resized)

    # Paste badge onto QR center
    center_x = (img_size - badge_dim) // 2
    center_y = (img_size - badge_dim) // 2
    qr_img.paste(badge, (center_x, center_y), badge)

    # Verify with OpenCV
    cv_img = cv2.cvtColor(np.array(qr_img), cv2.COLOR_RGBA2BGR)
    det = cv2.QRCodeDetector()
    decoded, _, _ = det.detectAndDecode(cv_img)
    if decoded != url:
        print(f"Warning: OpenCV decode returned: '{decoded}'")
    else:
        print(f"QR Code verified 100% scannable: '{decoded}'")

    return qr_img

def generate_svg_qr(url: str, output_path: str, logo_path: str):
    """
    Generates a clean vector SVG QR code with embedded party logo
    """
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=1, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    matrix = qr.get_matrix()
    matrix_size = len(matrix)
    border = 4

    with open(logo_path, 'rb') as f:
        logo_b64 = base64.b64encode(f.read()).decode('utf-8')

    svg_lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {matrix_size} {matrix_size}" width="100%" height="100%">',
        f'  <rect width="{matrix_size}" height="{matrix_size}" fill="#ffffff"/>'
    ]

    def in_finder(r, c):
        if r < border + 7 and c < border + 7: return True
        if r < border + 7 and c >= matrix_size - border - 7: return True
        if r >= matrix_size - border - 7 and c < border + 7: return True
        return False

    # Data modules
    for r in range(matrix_size):
        for c in range(matrix_size):
            if matrix[r][c] and not in_finder(r, c):
                svg_lines.append(f'  <rect x="{c}" y="{r}" width="1" height="1" rx="0.22" fill="#133063"/>')

    # 3 Finder patterns
    def add_eye(top_row, left_col):
        x = left_col
        y = top_row
        svg_lines.append(f'  <rect x="{x}" y="{y}" width="7" height="7" rx="1.4" fill="#133063"/>')
        svg_lines.append(f'  <rect x="{x+1}" y="{y+1}" width="5" height="5" rx="1.0" fill="#ffffff"/>')
        svg_lines.append(f'  <rect x="{x+2}" y="{y+2}" width="3" height="3" rx="0.6" fill="#0284c7"/>')

    add_eye(border, border)
    add_eye(border, matrix_size - border - 7)
    add_eye(matrix_size - border - 7, border)

    # Center badge
    badge_dim = matrix_size * 0.24
    bx = (matrix_size - badge_dim) / 2
    by = (matrix_size - badge_dim) / 2
    svg_lines.append(f'  <rect x="{bx:.2f}" y="{by:.2f}" width="{badge_dim:.2f}" height="{badge_dim:.2f}" rx="2.2" fill="#ffffff" stroke="#133063" stroke-width="0.35"/>')
    svg_lines.append(f'  <rect x="{bx+0.4:.2f}" y="{by+0.4:.2f}" width="{badge_dim-0.8:.2f}" height="{badge_dim-0.8:.2f}" rx="1.8" fill="#ffffff" stroke="#0284c7" stroke-width="0.2"/>')
    svg_lines.append(f'  <image href="data:image/png;base64,{logo_b64}" x="{bx+0.8:.2f}" y="{by+0.8:.2f}" width="{badge_dim-1.6:.2f}" height="{badge_dim-1.6:.2f}" preserveAspectRatio="xMidYMid meet"/>')
    svg_lines.append('</svg>')

    svg_str = '\n'.join(svg_lines)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg_str)
    print(f"SVG saved to {output_path} (with embedded logo)")

def draw_centered_text(draw, text, y, font, fill, width):
    """Draws horizontally centered text"""
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    x = (width - text_w) // 2
    draw.text((x, y), text, font=font, fill=fill)
    return y + (bbox[3] - bbox[1])

def generate_a4_poster(qr_image: Image.Image, output_pdf: str, output_png: str, logo_path: str):
    """
    Generates an ultra-high-resolution A4 Poster (2480 x 3508 px @ 300 DPI)
    """
    W = 2480
    H = 3508
    poster = Image.new('RGB', (W, H), (255, 255, 255))
    draw = ImageDraw.Draw(poster)

    # 1. Top Decorative Bars (Egyptian Flag + Party Sky Blue)
    draw.rectangle([(0, 0), (W, 14)], fill=EGYPT_RED)
    draw.rectangle([(0, 14), (W, 28)], fill=WHITE)
    draw.rectangle([(0, 28), (W, 42)], fill=EGYPT_BLACK)
    draw.rectangle([(0, 42), (W, 52)], fill=CYAN)

    # 2. Institutional Top Header
    font_inst = get_font(46, bold=True)
    txt_right = ar("جمهورية مصر العربية")
    draw.text((W - 140 - draw.textbbox((0, 0), txt_right, font=font_inst)[2], 120), txt_right, font=font_inst, fill=NAVY)

    txt_left = ar("حزب مستقبل وطن")
    draw.text((140, 120), txt_left, font=font_inst, fill=NAVY)

    # Party Logo in Center Top
    logo = Image.open(logo_path).convert('RGBA')
    logo_target_h = 240
    lw, lh = logo.size
    logo_target_w = int(lw * (logo_target_h / lh))
    logo_header = logo.resize((logo_target_w, logo_target_h), Image.Resampling.LANCZOS)
    poster.paste(logo_header, ((W - logo_target_w) // 2, 80), logo_header)

    # Institutional Banner Pill: أمانة مركز بركة السبع - أمانة الشباب
    pill_w, pill_h = 1680, 84
    pill_x = (W - pill_w) // 2
    pill_y = 350
    draw.rounded_rectangle([(pill_x, pill_y), (pill_x + pill_w, pill_y + pill_h)], radius=42, fill=LIGHT_BLUE, outline=CYAN, width=3)
    txt_branch = ar("أمانة مركز بركة السبع  •  أمانة الشباب")
    font_branch = get_font(46, bold=True)
    bbox_branch = draw.textbbox((0, 0), txt_branch, font=font_branch)
    draw.text((pill_x + (pill_w - (bbox_branch[2] - bbox_branch[0])) // 2, pill_y + 14), txt_branch, font=font_branch, fill=NAVY)

    # Divider line
    draw.line([(180, 470), (W - 180, 470)], fill=BORDER_GRAY, width=3)

    # 3. Main Call to Action (Hero Heading)
    txt_hero = ar("امسح الرمز للدخول إلى المنصة الرسمية")
    font_hero = get_font(74, bold=True)
    draw_centered_text(draw, txt_hero, 510, font_hero, NAVY, W)

    txt_sub = ar("وجّه كاميرا هاتفك المحمول نحو الرمز لفتح المنصة مباشرة")
    font_sub = get_font(44, bold=False)
    draw_centered_text(draw, txt_sub, 615, font_sub, DARK_GRAY, W)

    # 4. QR Code Card Container
    card_w, card_h = 1640, 1560
    card_x = (W - card_w) // 2
    card_y = 700

    # Draw card container
    draw.rounded_rectangle([(card_x, card_y), (card_x + card_w, card_y + card_h)], radius=48, fill=WHITE, outline=BORDER_GRAY, width=4)
    # Inner light cyan accent frame
    draw.rounded_rectangle([(card_x + 16, card_y + 16), (card_x + card_w - 16, card_y + card_h - 16)], radius=38, fill=WHITE, outline=LIGHT_BLUE, width=3)

    # QR Code inside Card
    qr_display_size = 1200
    qr_resized = qr_image.resize((qr_display_size, qr_display_size), Image.Resampling.LANCZOS)
    qr_x = (W - qr_display_size) // 2
    qr_y = card_y + 70
    poster.paste(qr_resized, (qr_x, qr_y), qr_resized)

    # Instruction Badge under QR inside Card
    badge_w, badge_h = 1260, 84
    badge_x = (W - badge_w) // 2
    badge_y = qr_y + qr_display_size + 45
    draw.rounded_rectangle([(badge_x, badge_y), (badge_x + badge_w, badge_y + badge_h)], radius=42, fill=LIGHT_BLUE, outline=CYAN, width=3)
    txt_scan = ar("📷  افتح كاميرا الهاتف  •  وجّه العدسة نحو الرمز  •  انقر للفتح")
    font_scan = get_font(38, bold=True)
    bbox_scan = draw.textbbox((0, 0), txt_scan, font=font_scan)
    draw.text((badge_x + (badge_w - (bbox_scan[2] - bbox_scan[0])) // 2, badge_y + 18), txt_scan, font=font_scan, fill=NAVY)

    # 5. Service Pillars (3 Feature Boxes)
    pillars = [
        "تقديم ومتابعة الشكاوى والطلبات",
        "الانضمام لأمانة الشباب ولجان العمل",
        "متابعة المبادرات والأنشطة الميدانية"
    ]
    font_pil = get_font(38, bold=True)
    box_w = 680
    box_h = 110
    total_boxes_w = 3 * box_w + 2 * 40
    start_boxes_x = (W - total_boxes_w) // 2
    boxes_y = 2320

    for i, p_text in enumerate(pillars):
        bx = start_boxes_x + i * (box_w + 40)
        draw.rounded_rectangle([(bx, boxes_y), (bx + box_w, boxes_y + box_h)], radius=24, fill=WHITE, outline=BORDER_GRAY, width=3)
        draw.rounded_rectangle([(bx + 15, boxes_y + 6), (bx + box_w - 15, boxes_y + 12)], radius=3, fill=CYAN)
        t_reshaped = ar(p_text)
        tb = draw.textbbox((0, 0), t_reshaped, font=font_pil)
        draw.text((bx + (box_w - (tb[2] - tb[0])) // 2, boxes_y + 36), t_reshaped, font=font_pil, fill=NAVY)

    # 6. Official Domain URL Card
    domain_w, domain_h = 1760, 150
    domain_x = (W - domain_w) // 2
    domain_y = 2490
    draw.rounded_rectangle([(domain_x, domain_y), (domain_x + domain_w, domain_y + domain_h)], radius=40, fill=NAVY)
    draw.rounded_rectangle([(domain_x + 6, domain_y + 6), (domain_x + domain_w - 6, domain_y + domain_h - 6)], radius=34, outline=CYAN, width=3)

    txt_url_label = ar("الرابط المباشر للمنصة الرسمية:")
    font_url_label = get_font(34, bold=False)
    draw.text((domain_x + (domain_w - draw.textbbox((0, 0), txt_url_label, font=font_url_label)[2]) // 2, domain_y + 22), txt_url_label, font=font_url_label, fill=LIGHT_BLUE)

    txt_url = "https://mostaqbal-shabab.vercel.app/"
    font_url = get_font(48, bold=True)
    tb_u = draw.textbbox((0, 0), txt_url, font=font_url)
    draw.text((domain_x + (domain_w - (tb_u[2] - tb_u[0])) // 2, domain_y + 75), txt_url, font=font_url, fill=WHITE)

    # 7. Official Slogan & Watermark
    txt_slogan = ar("كلنا نعمل من أجل مصر  •  مستقبل وطن")
    font_slogan = get_font(52, bold=True)
    draw_centered_text(draw, txt_slogan, 2730, font_slogan, NAVY, W)

    txt_motto = ar("معاً نبني المستقبل بسواعد شباب بركة السبع الواعد")
    font_motto = get_font(38, bold=False)
    draw_centered_text(draw, txt_motto, 2815, font_motto, MUTED_GRAY, W)

    txt_info = ar("محافظة المنوفية  •  أمانة مركز بركة السبع  •  مقر الأمانة متاح لخدمة جميع المواطنين والشباب")
    font_info = get_font(32, bold=False)
    draw_centered_text(draw, txt_info, 2900, font_info, DARK_GRAY, W)

    # 8. Bottom Egyptian Tricolor Flag Ribbon & Navy Border
    draw.rectangle([(0, H - 42), (W, H - 28)], fill=EGYPT_RED)
    draw.rectangle([(0, H - 28), (W, H - 14)], fill=WHITE)
    draw.rectangle([(0, H - 14), (W, H)], fill=EGYPT_BLACK)
    draw.rectangle([(0, H - 52), (W, H - 42)], fill=NAVY)

    # Save PNG
    poster.save(output_png, 'PNG', quality=100)
    print(f"A4 Poster PNG saved to {output_png}")

    # Save PDF
    poster.save(output_pdf, 'PDF', resolution=300.0)
    print(f"A4 Poster PDF saved to {output_pdf}")

def generate_a5_stand(qr_image: Image.Image, output_pdf: str, output_png: str, logo_path: str):
    """
    Generates a desk stand / table tent card (1748 x 2480 px @ 300 DPI - A5)
    """
    W = 1748
    H = 2480
    stand = Image.new('RGB', (W, H), (255, 255, 255))
    draw = ImageDraw.Draw(stand)

    # Top Bar
    draw.rectangle([(0, 0), (W, 12)], fill=EGYPT_RED)
    draw.rectangle([(0, 12), (W, 24)], fill=WHITE)
    draw.rectangle([(0, 24), (W, 36)], fill=EGYPT_BLACK)
    draw.rectangle([(0, 36), (W, 46)], fill=CYAN)

    # Header with Logo
    logo = Image.open(logo_path).convert('RGBA')
    lh_target = 200
    lw, lh = logo.size
    lw_target = int(lw * (lh_target / lh))
    logo_stand = logo.resize((lw_target, lh_target), Image.Resampling.LANCZOS)
    stand.paste(logo_stand, ((W - lw_target) // 2, 80), logo_stand)

    # Titles
    txt_party = ar("حزب مستقبل وطن")
    font_party = get_font(52, bold=True)
    draw_centered_text(draw, txt_party, 310, font_party, NAVY, W)

    txt_shabab = ar("أمانة مركز بركة السبع  •  أمانة الشباب")
    font_shabab = get_font(40, bold=True)
    draw_centered_text(draw, txt_shabab, 385, font_shabab, CYAN, W)

    # Call to action
    txt_cta = ar("امسح الرمز للدخول إلى المنصة")
    font_cta = get_font(58, bold=True)
    draw_centered_text(draw, txt_cta, 475, font_cta, NAVY, W)

    # QR Code Frame
    frame_dim = 1180
    fx = (W - frame_dim) // 2
    fy = 570
    draw.rounded_rectangle([(fx, fy), (fx + frame_dim, fy + frame_dim)], radius=40, fill=WHITE, outline=BORDER_GRAY, width=4)
    draw.rounded_rectangle([(fx + 15, fy + 15), (fx + frame_dim - 15, fy + frame_dim - 15)], radius=30, fill=WHITE, outline=LIGHT_BLUE, width=3)

    qr_size = 980
    qr_resized = qr_image.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
    stand.paste(qr_resized, ((W - qr_size) // 2, fy + (frame_dim - qr_size) // 2), qr_resized)

    # Scan Badge
    txt_scan = ar("📷  وجّه كاميرا الهاتف نحو الرمز للدخول  📷")
    font_scan = get_font(38, bold=True)
    badge_w, badge_h = 1000, 74
    bx = (W - badge_w) // 2
    by = 1800
    draw.rounded_rectangle([(bx, by), (bx + badge_w, by + badge_h)], radius=37, fill=LIGHT_BLUE, outline=CYAN, width=3)
    tb_s = draw.textbbox((0, 0), txt_scan, font=font_scan)
    draw.text((bx + (badge_w - (tb_s[2] - tb_s[0])) // 2, by + 14), txt_scan, font=font_scan, fill=NAVY)

    # Domain Box
    dom_w, dom_h = 1300, 120
    dx = (W - dom_w) // 2
    dy = 1920
    draw.rounded_rectangle([(dx, dy), (dx + dom_w, dy + dom_h)], radius=30, fill=NAVY)
    txt_url = "https://mostaqbal-shabab.vercel.app/"
    font_u = get_font(42, bold=True)
    tb_u = draw.textbbox((0, 0), txt_url, font=font_u)
    draw.text((dx + (dom_w - (tb_u[2] - tb_u[0])) // 2, dy + 35), txt_url, font=font_u, fill=WHITE)

    # Footer
    txt_foot = ar("كلنا نعمل من أجل مصر  •  مستقبل وطن")
    font_foot = get_font(40, bold=True)
    draw_centered_text(draw, txt_foot, 2120, font_foot, NAVY, W)

    # Bottom Ribbon
    draw.rectangle([(0, H - 36), (W, H - 24)], fill=EGYPT_RED)
    draw.rectangle([(0, H - 24), (W, H - 12)], fill=WHITE)
    draw.rectangle([(0, H - 12), (W, H)], fill=EGYPT_BLACK)
    draw.rectangle([(0, H - 44), (W, H - 36)], fill=NAVY)

    stand.save(output_png, 'PNG', quality=100)
    print(f"A5 Stand PNG saved to {output_png}")
    stand.save(output_pdf, 'PDF', resolution=300.0)
    print(f"A5 Stand PDF saved to {output_pdf}")

def main():
    url = "https://mostaqbal-shabab.vercel.app/"
    print(f"Generating QR assets for: {url}")
    logo_path = os.path.join(PUBLIC_DIR, 'logo.png')

    # 1. Generate ultra-high-resolution styled QR image
    qr_img = generate_styled_qr(url, output_size=2000, logo_path=logo_path)
    
    qr_png_path = os.path.join(PUBLIC_DIR, 'qr-mostaqbal-shabab.png')
    qr_img.save(qr_png_path, 'PNG')
    print(f"Saved {qr_png_path} (2000x2000)")

    # Also save as qr-code.png
    qr_code_path = os.path.join(PUBLIC_DIR, 'qr-code.png')
    qr_img.save(qr_code_path, 'PNG')
    print(f"Saved {qr_code_path}")

    # 2. Generate SVG with embedded logo
    svg_path = os.path.join(PUBLIC_DIR, 'qr-mostaqbal-shabab.svg')
    generate_svg_qr(url, output_path=svg_path, logo_path=logo_path)

    # 3. Generate A4 Printable Poster PDF & PNG
    generate_a4_poster(
        qr_img,
        output_pdf=os.path.join(PUBLIC_DIR, 'qr-poster-A4.pdf'),
        output_png=os.path.join(PUBLIC_DIR, 'qr-poster-A4.png'),
        logo_path=logo_path
    )

    # 4. Generate A5 Desk Stand PDF & PNG
    generate_a5_stand(
        qr_img,
        output_pdf=os.path.join(PUBLIC_DIR, 'qr-stand-A5.pdf'),
        output_png=os.path.join(PUBLIC_DIR, 'qr-stand-A5.png'),
        logo_path=logo_path
    )

    print("\nAll assets generated successfully!")

if __name__ == '__main__':
    main()
