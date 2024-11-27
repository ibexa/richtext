<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\Tests\Integration\FieldTypeRichText\REST;

use Ibexa\Contracts\Test\Rest\WebTestCase;

final class RichTextConfigTest extends WebTestCase
{
    /**
     * @dataProvider provideForTestConfig
     */
    public function testConfig(
        string $type,
        string $acceptHeader,
        string $snapshot
    ): void {
        $this->client->request('GET', '/api/ibexa/v2/richtext-config', [], [], [
            'HTTP_ACCEPT' => $acceptHeader,
        ]);

        $this->assertResponseIsSuccessful();
        $response = $this->client->getResponse();
        $content = $response->getContent();
        self::assertIsString($content);

        if ($type === 'xml') {
            self::assertSame('application/vnd.ibexa.api.RichTextConfig+xml', $response->headers->get('Content-Type'));
            self::assertResponseMatchesXmlSnapshot($content, $snapshot);
        } elseif ($type === 'json') {
            self::assertSame('application/vnd.ibexa.api.RichTextConfig+json', $response->headers->get('Content-Type'));
            self::assertResponseMatchesJsonSnapshot($content, $snapshot);
        } else {
            throw new \LogicException(sprintf(
                'Unknown type: "%s". Expected one of: "%s"',
                $type,
                implode('", "', ['json', 'xml']),
            ));
        }
    }

    /**
     * @return iterable<array{
     *     'xml'|'json',
     *     non-empty-string,
     *     non-empty-string,
     * }>
     */
    public static function provideForTestConfig(): iterable
    {
        yield 'application/vnd.ibexa.api.RichTextConfig+json' => [
            'json',
            'application/vnd.ibexa.api.RichTextConfig+json',
            __DIR__ . '/_output/RichTextConfig.json',
        ];

        yield 'application/json' => [
            'json',
            'application/json',
            __DIR__ . '/_output/RichTextConfig.json',
        ];

        yield 'application/vnd.ibexa.api.RichTextConfig+xml' => [
            'xml',
            'application/vnd.ibexa.api.RichTextConfig+xml',
            __DIR__ . '/_output/RichTextConfig.xml',
        ];

        yield 'application/xml' => [
            'xml',
            'application/xml',
            __DIR__ . '/_output/RichTextConfig.xml',
        ];
    }
}
