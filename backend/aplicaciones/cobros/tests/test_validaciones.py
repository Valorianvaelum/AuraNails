from django.test import SimpleTestCase

from aplicaciones.cobros.serializers import AnularCobroSerializer


class AnularCobroSerializerTests(SimpleTestCase):
    def test_rechaza_motivos_vacios_o_menores_a_cinco_caracteres(self):
        for motivo in ("", "   ", "abcd", "  abc  "):
            serializer = AnularCobroSerializer(data={"motivo": motivo})
            self.assertFalse(serializer.is_valid())
            self.assertIn("motivo", serializer.errors)

    def test_acepta_limites_y_normaliza_espacios_exteriores(self):
        minimo = AnularCobroSerializer(data={"motivo": "  Error  "})
        self.assertTrue(minimo.is_valid(), minimo.errors)
        self.assertEqual(minimo.validated_data["motivo"], "Error")

        maximo = AnularCobroSerializer(data={"motivo": "x" * 250})
        self.assertTrue(maximo.is_valid(), maximo.errors)

    def test_rechaza_motivo_mayor_a_doscientos_cincuenta_caracteres(self):
        serializer = AnularCobroSerializer(data={"motivo": "x" * 251})
        self.assertFalse(serializer.is_valid())
        self.assertIn("motivo", serializer.errors)
