from ewiconfapi import MinimalConfluence
import os
import sys
import ntpath
import mistune
from md2cf.confluence_renderer import ConfluenceRenderer
import re
import time

dir = sys.argv[1]

#confluence = MinimalConfluence(host='https://somewiki.com/rest/api', username='', password='')
confluence = MinimalConfluence(host=os.environ['CFHOST'], username=os.environ['CFUSER'], password=os.environ['CFPASS'])

renderer = ConfluenceRenderer(use_xhtml=True)
confluence_mistune = mistune.Markdown(renderer=renderer)
parentPage = confluence.get_page(title=os.environ['CFPARENT'], space_key=os.environ['CFSPACE']) 

regex = re.compile(r"(<ri:url ri:value=\"data:image/png;base64.*)</ri:url>", re.IGNORECASE)

for root, subdirs, files in os.walk(dir):
    for filename in files:
        try:
            basename = ntpath.basename(filename)
            file_path = os.path.join(root, filename)
            if(basename=="home.md"):
                basename=os.environ['CFPARENT']+".md"
            if (basename.endswith(".md")):
                print("process " + basename)
                title = basename[:-3] #.replace("-", " ")
                print("title: " + title)
                with open(file_path, 'r') as mdfile:
                    markdown_data = mdfile.read()
                confluence_body = confluence_mistune(markdown_data)
                print("converted fo confluence format")
                page = confluence.get_page(title=title, space_key=os.environ['CFSPACE'])
                if (page==None):
                    print("page not found")
                    confluence_body = str(confluence_body).strip().replace("<br>", "<br/>").replace("</br>", "<br/>").replace('<ri:url ri:value="', '<ri:attachment ri:filename="').replace('></ri:url>',' />')
                    print("newBody" + confluence_body)
                    confluence.create_page(space=os.environ['CFSPACE'], title=title, body=confluence_body, update_message='Created page', parent_id=parentPage.id)
                    page = confluence.get_page(title=title, space_key=os.environ['CFSPACE'])
                else:
                    print("page found")
                    #print(page)

                currentBody = str(page.body.storage.value).strip().replace('style="text-align: left;"', 'style="text-align:left"')
                regex.sub("<ri:url />", currentBody)
                newBody = str(confluence_body).strip().replace("<br>", "<br/>").replace("</br>", "<br/>").replace('<ri:url ri:value="', '<ri:attachment ri:filename="').replace('></ri:url>',' />')
                if(currentBody != newBody):
                    print("updating")
                    print("currentBody" + currentBody)
                    print("newBody" + newBody)
                    confluence.delete_page(page)
                    confluence.create_page(space=os.environ['CFSPACE'], title=title, body=confluence_body, update_message='Synchronized page', parent_id=parentPage.id)
                    confluence.create_page(space=os.environ['CFSPACE'], title=title, body=confluence_body, update_message='Synchronized page', parent_id=parentPage.id)
                else:
                    print("not changed, skipped")
        except Exception as e:
            print(e)
