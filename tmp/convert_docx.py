from docx import Document
import sys

def docx_to_markdown(docx_path, md_path):
    doc = Document(docx_path)
    md_content = []

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            md_content.append('')
            continue

        style = para.style.name if para.style else 'Normal'

        if 'Heading 1' in style:
            md_content.append(f'# {text}')
        elif 'Heading 2' in style:
            md_content.append(f'## {text}')
        elif 'Heading 3' in style:
            md_content.append(f'### {text}')
        elif 'Heading 4' in style:
            md_content.append(f'#### {text}')
        else:
            md_content.append(text)

    with open(md_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md_content))
    print(f'已生成: {md_path}')

if __name__ == '__main__':
    docx_to_markdown('/home/project/outputs/虾蛋星球网站详细介绍_v2.0.docx', '/home/project/outputs/虾蛋星球网站详细介绍_v2.0.md')
    docx_to_markdown('/home/project/outputs/虾蛋星球融资计划书_天使轮_v1.0.docx', '/home/project/outputs/虾蛋星球融资计划书_天使轮_v1.0.md')
