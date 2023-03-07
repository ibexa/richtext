<?php

/**
 * @copyright Copyright (C) Ibexa AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
declare(strict_types=1);

namespace Ibexa\FieldTypeRichText\Persistence\Legacy\MigrateRichTextNamespaces\Gateway;

use Doctrine\DBAL\Connection;
use Ibexa\Contracts\FieldTypeRichText\Persistence\Legacy\MigrateRichTextNamespaces\AbstractGateway;

/**
 * @internal
 */
final class DoctrineDatabase extends AbstractGateway
{
    private const TABLE_CONTENT_ATTRIBUTE = 'ezcontentobject_attribute';
    private const COLUMN_DATA_TEXT = 'data_text';
    private const FIELD_TYPE_IDENTIFIER = 'ezrichtext';

    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    public function migrate(array $values): int
    {
        $qb = $this->connection->createQueryBuilder();
        $qb
            ->update(self::TABLE_CONTENT_ATTRIBUTE)
            ->set(
                self::COLUMN_DATA_TEXT,
                $this->addReplaceStatement($qb, self::COLUMN_DATA_TEXT, $values)
            )
            ->andWhere(
                $qb->expr()->eq(
                    'data_type_string',
                    $qb->createPositionalParameter(
                        self::FIELD_TYPE_IDENTIFIER
                    )
                )
            );

        return (int)$qb->execute();
    }
}
