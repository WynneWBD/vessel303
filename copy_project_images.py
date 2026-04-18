#!/usr/bin/env python3
"""Copy and rename showcase project images to public/images/projects/."""

import os
import shutil
import re

BASE_ASSETS = "/Users/wynnewbd/Desktop/vessel303/vessel303-assets/新官网项目详情"
BASE_PUBLIC = "/Users/wynnewbd/Desktop/vessel303/public/images/projects"

FOLDER_TO_ID = {
    # Overseas
    "01-海外项目/阿根廷Centro Comercial Nordelta": "argentina-nordelta",
    "01-海外项目/俄罗斯Калак": "russia-kalak",
    "01-海外项目/俄罗斯Astro Base Mamison Hotel": "astrobase-mamison",
    "01-海外项目/美国Clewiston, Florida": "usa-clewiston",
    "01-海外项目/美国Georgetown, Louisiana": "usa-georgetown",
    "01-海外项目/美国Mount Pleasant, Texas": "usa-mount-pleasant",
    "01-海外项目/日本SPACE-VESSEL Base - Vacation STAY 42244v": "japan-space-vessel",
    "01-海外项目/日本瀬戸の浜 Beach&Resort": "japan-setonohama",
    "01-海外项目/泰国Nx Space Pool Villa": "thailand-nx-space",
    "01-海外项目/以色列Dream Island Spa & Health Resort": "israel-dream-island",
    # Domestic
    "02-国内项目/常州太湖湾露营谷": "changzhou-taihu",
    "02-国内项目/敦煌雅丹国家地质公园星辰驿站": "dunhuang-yardang",
    "02-国内项目/福建东山彩蝶湾景区特色民宿(环岛路分店)": "fujian-dongshan",
    "02-国内项目/甘肃白银龙山民宿": "gansu-baiyin",
    "02-国内项目/甘肃和政星语云端": "gansu-hezheng",
    "02-国内项目/广东佛山云东海蒹葭苍苍露营地": "guangdong-foshan",
    "02-国内项目/广东河源万绿湖心乐青谷": "guangdong-heyuan",
    "02-国内项目/广东惠州巽寮湾假日星球": "guangdong-huizhou",
    "02-国内项目/广东肇庆六角泉森林康养基地": "guangdong-zhaoqing",
    "02-国内项目/广东珠海临海·星空海景美宿(飞沙滩店)": "guangdong-zhuhai",
    "02-国内项目/广西贺州鹊鸣春太空舱民宿": "guangxi-hezhou",
    "02-国内项目/广西黄姚乐耘庄园": "guangxi-huangyao",
    "02-国内项目/贵州花溪晚霞星宿营地": "guizhou-huaxi",
    "02-国内项目/海南琼海无所归止汐语民宿": "hainan-qionghai",
    "02-国内项目/河北张家口五色天路帐篷营地": "hebei-zhangbei",
    "02-国内项目/黑龙江东极岛贝壳沙滩营地": "heilongjiang-fuyuan",
    "02-国内项目/湖北武汉清凉寨树影行星太空舱民宿": "hubei-wuhan",
    "02-国内项目/青海湖同宝山登山观湖特色野奢露营民宿": "qinghai-tongbao",
    "02-国内项目/青海祁连托茂部落·生态营地": "qinghai-qilian",
    "02-国内项目/山西西建大禹渡太空舱休闲度假湾": "shanxi-dayu",
    "02-国内项目/山西云丘山轻野·HOME酒店": "shanxi-yunqiu",
    "02-国内项目/四川成都熊猫森林": "sichuan-chengdu",
    "02-国内项目/四川轿顶山麋鹿生活营": "sichuan-jiaoding",
    "02-国内项目/四川遂宁烟火里帐篷营地": "sichuan-suining",
    "02-国内项目/台湾惠来大雪山营地": "taiwan-daxueshan",
    "02-国内项目/乌海漠海山境露营地": "wuhai-desert",
    "02-国内项目/西藏加拉桃源雪峰温泉民宿": "tibet-jiala",
    "02-国内项目/新疆伊犁黑蜂庄园生态酒店": "xinjiang-yili",
    "02-国内项目/云南八珠在春天摩梭家园": "yunnan-mosuo",
    "02-国内项目/云南玉溪映月潭圆梦营酒店": "yunnan-yuxi",
}

SKIP_EXTS = {'.heic', '.dng', '.docx', '.doc', '.pdf', '.DS_Store'}

def get_dest_name(src_filename, idx):
    """Generate destination filename from source, numbering from idx."""
    name_lower = src_filename.lower()
    ext = os.path.splitext(src_filename)[1].lower()
    n = str(idx).zfill(2)
    if '室内' in src_filename or 'interior' in name_lower:
        prefix = 'interior'
    elif '外观' in src_filename or 'exterior' in name_lower or 'outside' in name_lower:
        prefix = 'exterior'
    elif '配套' in src_filename or 'facility' in name_lower:
        prefix = 'facility'
    else:
        prefix = 'image'
    return f"{prefix}-{n}{ext}"

def copy_project(rel_folder, project_id):
    src_dir = os.path.join(BASE_ASSETS, rel_folder)
    dst_dir = os.path.join(BASE_PUBLIC, project_id)

    if not os.path.isdir(src_dir):
        print(f"  SKIP (not found): {src_dir}")
        return []

    # Get eligible image files
    files = sorted([
        f for f in os.listdir(src_dir)
        if os.path.splitext(f)[1].lower() not in SKIP_EXTS
        and not f.startswith('.')
        and os.path.isfile(os.path.join(src_dir, f))
    ])

    if not files:
        print(f"  NO images: {project_id}")
        return []

    # Sort: 外观 first, 室内 second, rest after
    def sort_key(f):
        if '外观' in f or 'exterior' in f.lower(): return (0, f)
        if '室内' in f or 'interior' in f.lower(): return (1, f)
        return (2, f)
    files.sort(key=sort_key)

    # Group by type for proper numbering
    exterior_files = [f for f in files if '外观' in f or 'exterior' in f.lower()]
    interior_files = [f for f in files if '室内' in f or 'interior' in f.lower()]
    other_files = [f for f in files if f not in exterior_files and f not in interior_files]

    os.makedirs(dst_dir, exist_ok=True)

    copied = []
    ext_i, int_i, img_i = 1, 1, 1

    def copy_file(src_name, dest_name):
        src = os.path.join(src_dir, src_name)
        dst = os.path.join(dst_dir, dest_name)
        shutil.copy2(src, dst)
        copied.append(f"/images/projects/{project_id}/{dest_name}")

    for f in exterior_files:
        ext = os.path.splitext(f)[1].lower()
        copy_file(f, f"exterior-{str(ext_i).zfill(2)}{ext}")
        ext_i += 1

    for f in interior_files:
        ext = os.path.splitext(f)[1].lower()
        copy_file(f, f"interior-{str(int_i).zfill(2)}{ext}")
        int_i += 1

    for f in other_files:
        ext = os.path.splitext(f)[1].lower()
        copy_file(f, f"image-{str(img_i).zfill(2)}{ext}")
        img_i += 1

    print(f"  ✓ {project_id}: {len(copied)} images")
    return copied

results = {}
for rel_folder, project_id in FOLDER_TO_ID.items():
    # Skip astrobase-mamison, images already copied
    if project_id == 'astrobase-mamison':
        dst_dir = os.path.join(BASE_PUBLIC, project_id)
        existing = sorted([
            f"/images/projects/{project_id}/{f}"
            for f in os.listdir(dst_dir)
            if os.path.isfile(os.path.join(dst_dir, f)) and not f.startswith('.')
        ]) if os.path.isdir(dst_dir) else []
        results[project_id] = existing
        print(f"  (skip) {project_id}: {len(existing)} images already present")
        continue
    results[project_id] = copy_project(rel_folder, project_id)

print("\n=== SUMMARY ===")
for pid, imgs in results.items():
    print(f"{pid}: {imgs}")
