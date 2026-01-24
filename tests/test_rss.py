import os
import xml.etree.ElementTree as ET

def test_rss_structure():
    assert os.path.exists("rss.xml"), "Le fichier rss.xml n'existe pas"

    tree = ET.parse("rss.xml")
    root = tree.getroot()

    # Vérifie la racine
    assert root.tag == "rss"
    assert root.attrib.get("version") == "2.0"

    channel = root.find("channel")
    assert channel is not None, "<channel> manquant"

    # Vérifie quelques champs obligatoires
    assert channel.find("title") is not None
    assert channel.find("link") is not None
    assert channel.find("description") is not None

    items = channel.findall("item")
    assert len(items) > 0, "Aucun <item> dans le flux"

    # Vérifie un item
    for item in items:
        assert item.find("title") is not None
        assert item.find("link") is not None
        assert item.find("guid") is not None
        assert item.find("pubDate") is not None
        break
